import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, updateLastLogin, createUser, verifyUser } from '../db/users';
import { createSession, getSession, refreshSession, deleteSession } from '../auth/sessions';
import { CreateEmailVerificationChallenge, SendVerificationChallengeEmail, GetEmailVerificationChallenge, DeleteEmailVerificationChallenge } from '../auth/email_verification'

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRATION = '1h';

function signAccessToken(userId: string, email: string, userType: 'user' | 'admin', sessionId: string) {
    return jwt.sign(
        { sub: userId, email, userType, sid: sessionId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );
}

// login route
// expects email and password in the request body
router.post('/login', async (req, res) => {
                let { email, password } = req.body ?? {};
                
                if (!email || !password) {
                    return res.status(400).json({ message: 'Email and password are required.' });
                }
                
                email = email.toLowerCase();
                
                const user = await getUserByEmail(email);
                if (!user) {
                    return res.status(401).json({ message: 'Invalid email or password.' });
                }
                
                const valid = await bcrypt.compare(password, user.password_hash);
                if (!valid) {
                    return res.status(401).json({ message: 'Invalid email or password.' });
                }
                
                if(!user.email_verified)
                {
                    return res.status(303).json({ message: 'Email is not verified, verify before logging in.' });
                }
                
                await updateLastLogin(user.id);
                
                const { sessionId, refreshToken } = await createSession(user.id, user.email, user.user_type);
                const accessToken = signAccessToken(user.id, user.email, user.user_type, sessionId);
                
                res.json({ 
                             accessToken, 
                             refreshToken,
                             sessionId,
                         });
            });

// refresh route
// uses userId, sessionId, and refreshToken to generate a new access token
router.post('/refresh', async (req, res) => {
    const { userId, sessionId, refreshToken } = req.body ?? {};

    if (!userId || !sessionId || !refreshToken) {
        return res.status(400).json({ message: 'userId, sessionId, and refreshToken are required.' });
    }

    const session = await getSession(userId, sessionId);
    if (!session || session.refreshToken !== refreshToken) {
        return res.status(401).json({ message: 'Invalid session or refresh token.' });
    }   

    // refreshes session's TTL
    await refreshSession(userId, sessionId);

    // generates a new access token
    const accessToken = signAccessToken(userId, session.email, session.userType, sessionId);
    // returns new access token to client
    res.json({ accessToken });
});

// logout route
// deletes the session from redis
router.post('/logout', async (req, res) => {
    const { userId, sessionId } = req.body ?? {};

    if (userId && sessionId) {
        await deleteSession(userId, sessionId);
    }

    res.json({ message: 'Logged out successfully.' });
});
router.post('/signup', async (req, res) => {
                let { f_name, l_name, email, u_name, password } = req.body ?? {};
                
                if(!f_name || !l_name || !email || !u_name || !password)
                {
                    return res.status(400).json({ success: false, message: 'Email and password must be valid.' });
                }
                
                email = email.toLowerCase();
                
                const user = await getUserByEmail(email);
                if(user)
                {
                    return res.status(401).json({ success: false, message: 'Email is already registered!' });
                }
                
                const password_salt = await bcrypt.genSalt(10);
                const password_hash = await bcrypt.hash(password, password_salt);
                
                if(!password_hash)
                {
                    return res.status(505).json({ success: false, message: 'Oops.' });
                }
                
                await createUser(f_name, l_name, email, u_name, password_hash);
                
                res.json({ success: true, message: 'User created succesfully!'});
                
            });

router.post('/email_challenge', async (req, res) => {
                // Todo(Leo): Check if this user email has an outstanding request and rate limit them to prevent people getting their
                // addresses spammed
                let { email, password } = req.body ?? {};
                
                if(!email || !password)
                {
                    return res.status(401).json({ message: 'Email and password should be valid' });
                }
                
                email = email.toLowerCase();
                
                const user = await getUserByEmail(email);
                if(!user || user.email_verified == true)
                {
                    return res.status(401).json({ message: 'User is not registered or email is verified!' });
                }
                
                // Check if this is da real user
                const valid = await bcrypt.compare(password, user.password_hash);
                if(!valid)
                {
                    return res.status(401).json({ message: 'Invalid email or password.' });
                }
                
                // Make a new challenge and email the code to the user
                const challenge = await CreateEmailVerificationChallenge(email);
                
                // Note(Leo): If challenge comes back NULL the user is being throttled
                if(!challenge)
                {
                    return res.status(401).json({ message: 'Too many requests to signup this email, wait a few minutes.' });
                }
                
                // Create our user object in the meantime
                
                await SendVerificationChallengeEmail(email, challenge.challenge_code);
                
                res.json({ message: 'Challenge has been started succesfully.'});
                
            });

router.post('/verify', async (req, res) => {
                let { email, code } = req.body ?? {};
                
                if(!email || !code)
                {
                    return res.status(401).json({ message: 'Code was invalid, expired or incorrect.' });
                }
                
                email = email.toLowerCase();
                
                const challenge = await GetEmailVerificationChallenge(email);
                
                if(!challenge || !challenge.code || !challenge.email)
                {
                    return res.status(401).json({ message: 'Code was invalid, expired or incorrect.' });
                }
                
                // We kill our challenge after one attempt to be safe
                await DeleteEmailVerificationChallenge(challenge.email);
                
                // User has succesfully verified
                if(challenge.code === code && challenge.email === email)
                {
                    await verifyUser(challenge.email);
                    
                    return res.json({ message: 'Challenge has been completed succesfully.'});
                }
                
                // User has fucked up
                return res.status(401).json({ message: 'Code was invalid, expired or incorrect.' });
            });

export default router;