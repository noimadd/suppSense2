import { randomUUID } from 'crypto';
import { redisClient } from '../db/redis';

const DEFAULT_SESSION_TTL = 60 * 60 * 24; // 1 day
const EXTENDED_SESSION_TTL = 60 * 60 * 24 * 30; // 30 days - for remember me functionality ADD THIS LATER!

interface SessionData {
    refreshToken: string;
    email: string;
    userType: 'user' | 'admin';
}

function sessionKey(userId: string, sessionId: string) {
    return `session:${userId}:${sessionId}`;
}

export async function createSession(userId: string, email: string, userType: 'user' | 'admin'): Promise<{ sessionId: string; refreshToken: string }> {
    const sessionId = randomUUID();
    const refreshToken = randomUUID();

    const data: SessionData = { refreshToken, email, userType }; 

    await redisClient.set(sessionKey(userId, sessionId), JSON.stringify(data), {
        EX: DEFAULT_SESSION_TTL,
    });

    return { sessionId, refreshToken };
}

export async function getSession(userId: string, sessionId: string): Promise<SessionData | null> {
    const data = await redisClient.get(sessionKey(userId, sessionId));
    return data ? JSON.parse(data) as SessionData : null;
}

export async function refreshSession(userId: string, sessionId: string): Promise<void> {
    await redisClient.expire(sessionKey(userId, sessionId), DEFAULT_SESSION_TTL);
}

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
    await redisClient.del(sessionKey(userId, sessionId));
}

export async function deleteAllSessions(userId: string): Promise<void> {
    const keys = await redisClient.keys(`session:${userId}:*`);
    if (keys.length) { await redisClient.del(keys); }
}