import { pool } from './pool';

export interface User {
    id: string;
    email: string;
    username: string;
    password_hash: string;
    user_type: 'user' | 'admin';
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
    );
    return result.rows[0] ?? null;
}

export async function updateLastLogin(userId: string): Promise<void> {
    await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
    );
}