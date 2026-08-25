import jwt from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';
import type { AccessTokenResponse } from '@suppsense/shared-types';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET)
{
    throw new Error('JWT_SECRET environment variable is not set');
}

/**
 * middleware to require auth for protected routes
 * 
 * 
 * checks for valid JWT in Authorization header
 * sets req.user to decoded token if valid
 * returns 401 Unauthorized if invalid or missing
*/
export function requireAuth(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
}

export function decodeAccessToken(token: string): AccessTokenResponse | null {
    try {
        return jwtDecode<AccessTokenResponse>(token);
    } catch {
        return null;
    }
}