import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, updateLastLogin } from '../db/users';
import { createSession, getSession, refreshSession, deleteSession } from '../auth/sessions';

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

router.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ message: 'Invalid email or password.' });
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

router.post('/refresh', async (req, res) => {
    const { userId, sessionId, refreshToken } = req.body ?? {};

    if (!userId || !sessionId || !refreshToken) {
        return res.status(400).json({ message: 'userId, sessionId, and refreshToken are required.' });
    }

    const session = await getSession(userId, sessionId);
    if (!session || session.refreshToken !== refreshToken) {
        return res.status(401).json({ message: 'Invalid session or refresh token.' });
    }   

    await refreshSession(userId, sessionId);

    const accessToken = signAccessToken(userId, session.email, session.userType, sessionId);
    res.json({ accessToken });
});

router.post('/logout', async (req, res) => {
    const { userId, sessionId } = req.body ?? {};

    if (userId && sessionId) {
        await deleteSession(userId, sessionId);
    }

    res.json({ message: 'Logged out successfully.' });
});

export default router;