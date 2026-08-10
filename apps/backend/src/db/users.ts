import { pool } from './pool';

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    password_hash: string;
    user_type: 'user' | 'admin';
    pfp_url: string;
    email_verified: boolean;
}

/**
 * gets a user by email
 * @param email users email
 * @returns all user data
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
    );
    return result.rows[0] ?? null;
}

/**
 * updates the last login 
 * @param userId uuid of user
 */
export async function updateLastLogin(userId: string): Promise<void> {
    await pool.query(
                     'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                     [userId]
                     );
}

export async function createUser(f_name: string, l_name: string, email: string, u_name: string, password_hash: string): Promise<User>
{
    const created = await pool.query<User>(
                                           'INSERT INTO users (first_name, last_name, email, username, password_hash, user_type, email_verified, created_at) VALUES($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)',
                                           [f_name, l_name, email.toLowerCase(), u_name, password_hash, 'user', false]
                                           );
    return created.rows[0] ?? null;
}

export async function verifyUser(email: string): Promise<void>
{
    await pool.query("UPDATE users SET email_verified = 't' WHERE email = $1", [email.toLowerCase()]);
}