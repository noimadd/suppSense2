import bcrypt from 'bcryptjs';
import type { AccessTokenResponse } from '@suppsense/shared-types';
import { getUserById } from '../db/users';

/**
 * middleware to restrict a route to admins - run requireAuth first
 *
 * The JWT's userType claim is checked first (cheap), then the DB is checked too, so an admin
 * who has been demoted or deleted loses access immediately rather than when their 1hr token expires.
 * sets req.admin to the admin's full user row
 * returns 403 Forbidden if the user isn't an admin
 */
export async function requireAdmin(req: any, res: any, next: any) {
    const claims = req.user as AccessTokenResponse | undefined;

    if (!claims || claims.userType !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await getUserById(claims.sub);
    if (!user || user.user_type !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    req.admin = user;
    next();
}

/**
 * Checks the admin re-entered their own password correctly. Used to confirm destructive actions
 * (deleting users/products) as per the design doc. Expects `password` in the request body.
 * @returns true if the password matches the logged in admin's
 */
export async function confirmAdminPassword(req: any): Promise<boolean> {
    const password = req.body?.password;
    if (typeof password !== 'string' || !password || !req.admin) {
        return false;
    }
    return bcrypt.compare(password, req.admin.password_hash);
}