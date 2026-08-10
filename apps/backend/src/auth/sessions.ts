import { randomUUID } from 'crypto';
import { redisClient } from '../db/redis';

const DEFAULT_SESSION_TTL = 60 * 60 * 24; // 1 day
const EXTENDED_SESSION_TTL = 60 * 60 * 24 * 30; // 30 days - for remember me functionality ADD THIS LATER!

interface SessionData {
    refreshToken: string;
    email: string;
    userType: 'user' | 'admin';
}

// generates redis key for session
function sessionKey(userId: string, sessionId: string) {
    return `session:${userId}:${sessionId}`;
}

/**
 * creates a new session for the user storing it in redis
 * @param userId uuid of user
 * @param email unique email from user
 * @param userType user or admin
 * @returns redis object with sessionId and refreshToken
 */
export async function createSession(userId: string, email: string, userType: 'user' | 'admin'): Promise<{ sessionId: string; refreshToken: string }> {
    const sessionId = randomUUID(); // generates unique session id
    const refreshToken = randomUUID(); // generates unique refresh token

    // stores data in redis
    const data: SessionData = { refreshToken, email, userType }; 
    await redisClient.set(sessionKey(userId, sessionId), JSON.stringify(data), {
        EX: DEFAULT_SESSION_TTL,
    });

    return { sessionId, refreshToken };
}

/**
 * retrieves session data from redis
 * @param userId uuid of user
 * @param sessionId unique session id
 * @returns session data or null if not found
 */
export async function getSession(userId: string, sessionId: string): Promise<SessionData | null> {
    const data = await redisClient.get(sessionKey(userId, sessionId));
    return data ? JSON.parse(data) as SessionData : null;
}

/**
 * resets ttl of session in redis
 * @param userId uuid of user
 * @param sessionId unique session id
 */
export async function refreshSession(userId: string, sessionId: string): Promise<void> {
    await redisClient.expire(sessionKey(userId, sessionId), DEFAULT_SESSION_TTL);
}

/**
 * deletes a session from redis
 * @param userId uuid of user
 * @param sessionId unique session id
 */
export async function deleteSession(userId: string, sessionId: string): Promise<void> {
    await redisClient.del(sessionKey(userId, sessionId));
}

/**
 * deletes all sessions for a user
 * @param userId uuid of user
 */
export async function deleteAllSessions(userId: string): Promise<void> {
    const keys = await redisClient.keys(`session:${userId}:*`);
    if (keys.length) { await redisClient.del(keys); }
}