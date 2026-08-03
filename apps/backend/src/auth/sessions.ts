import { randomUUID } from 'crypto';
import { redisClient } from '../db/redis';

const DEFAULT_SESSION_TTL = 60 * 60 * 24; // 1 day
const EXTENDED_SESSION_TTL = 60 * 60 * 24 * 30; // 30 days - for remember me functionality ADD THIS LATER!

function sessionKey(userId: string, sessionId: string) {
    return `session:${userId}:${sessionId}`;
}

export async function createSession(userId: string): Promise<{ sessionId: string; refreshToken: string }> {
    const sessionId = randomUUID();
    const refreshToken = randomUUID();

    await redisClient.set(sessionKey(userId, sessionId), refreshToken, {
        EX: DEFAULT_SESSION_TTL,
    });

    return { sessionId, refreshToken };
}

export async function validateSession(userId: string, sessionId: string, refreshToken: string): Promise<boolean> {
    const storedToken = await redisClient.get(sessionKey(userId, sessionId));
    return storedToken === refreshToken;
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