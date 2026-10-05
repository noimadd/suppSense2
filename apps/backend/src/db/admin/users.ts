import { pool } from '../pool';
import { Paginated, HttpError, likePattern, buildSetClause } from './util';
import type { AdminUser, AdminUserPatch } from '@suppsense/shared-types/src/admin';
export type { AdminUser, AdminUserPatch };

const USER_COLUMNS = 'id, first_name, last_name, email, username, user_type, email_verified, created_at, last_login';
const EDITABLE_USER_COLUMNS = ['first_name', 'last_name', 'email', 'username', 'user_type', 'email_verified'] as const;

// $1 is the ILIKE pattern or NULL for "everyone"
const USER_SEARCH_WHERE = `
    WHERE $1::text IS NULL
       OR email ILIKE $1
       OR username ILIKE $1
       OR (first_name || ' ' || last_name) ILIKE $1
`;

/**
 * lists users, newest first, optionally filtered by name/username/email
 * @param search free text search, matched anywhere in the name, username or email
 * @param limit max rows to return
 * @param offset rows to skip
 */
export async function searchUsers(search: string | null, limit: number, offset: number): Promise<Paginated<AdminUser>> {
    const pattern = likePattern(search);

    const [rows, count] = await Promise.all([
        pool.query<AdminUser>(
            `SELECT ${USER_COLUMNS} FROM users ${USER_SEARCH_WHERE} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [pattern, limit, offset]
        ),
        pool.query<{ total: number }>(
            `SELECT COUNT(*)::int AS total FROM users ${USER_SEARCH_WHERE}`,
            [pattern]
        ),
    ]);

    return { items: rows.rows, total: count.rows[0].total, limit, offset };
}

/**
 * gets a single user by id
 * @param id uuid of the user
 * @returns the user or null if they don't exist
 */
export async function getAdminUserById(id: string): Promise<AdminUser | null> {
    const result = await pool.query<AdminUser>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
}

/**
 * updates the given fields on a user
 * @param id uuid of the user
 * @param patch the fields to change - anything not in EDITABLE_USER_COLUMNS is ignored
 * @returns the updated user, or null if they don't exist
 */
export async function updateUser(id: string, patch: AdminUserPatch): Promise<AdminUser | null> {
    const normalised: AdminUserPatch = { ...patch };
    if (normalised.email !== undefined) {
        normalised.email = normalised.email.toLowerCase();

        // emails are the login key so they have to stay unique
        const clash = await pool.query('SELECT 1 FROM users WHERE email = $1 AND id <> $2', [normalised.email, id]);
        if (clash.rowCount) {
            throw new HttpError(409, 'That email is already in use by another account.');
        }
    }

    if (normalised.username !== undefined) {
        const clash = await pool.query('SELECT 1 FROM users WHERE username = $1 AND id <> $2', [normalised.username, id]);
        if (clash.rowCount) {
            throw new HttpError(409, 'That username is already taken.');
        }
    }

    const set = buildSetClause(normalised as Record<string, unknown>, EDITABLE_USER_COLUMNS, 2);
    if (!set) {
        return getAdminUserById(id);
    }

    const result = await pool.query<AdminUser>(
        `UPDATE users SET ${set.clause} WHERE id = $1 RETURNING ${USER_COLUMNS}`,
        [id, ...set.values]
    );
    return result.rows[0] ?? null;
}

/**
 * replaces a user's password hash (used by the admin password reset)
 * @param id uuid of the user
 * @param password_hash bcrypt hash of the new password
 * @returns true if the user existed
 */
export async function setUserPasswordHash(id: string, password_hash: string): Promise<boolean> {
    const result = await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [id, password_hash]);
    return (result.rowCount ?? 0) > 0;
}

/**
 * permanently deletes a user along with any submissions still waiting for review.
 * Their libraries go via ON DELETE CASCADE (deleted explicitly too, so this doesn't depend on it).
 * Products of theirs that were already approved stay in the DB (submitted_by is set to NULL by the FK).
 * Note: this does not touch Redis - the route is responsible for killing their sessions.
 * @param id uuid of the user
 * @returns true if the user existed
 */
export async function deleteUser(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM products WHERE submitted_by = $1 AND status = 'pending'`, [id]);
        await client.query('DELETE FROM librarydata WHERE user_id = $1', [id]);
        const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
        await client.query('COMMIT');
        return (result.rowCount ?? 0) > 0;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}