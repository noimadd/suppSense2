import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, updateLastLogin } from '../db/users';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

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

    const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username, user_type: user.user_type },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ token });
});

export default router;