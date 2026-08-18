import * as SecureStore from 'expo-secure-store';
import type { StoredSession } from './auth';

// stuff to be stored in keystore
const SESSION_KEYS = {
    accessToken: 'auth.accessToken',
    refreshToken: 'auth.refreshToken',
    sessionId: 'auth.sessionId',
    userId: 'auth.userId',
} as const;

/**
 * stores session data in keystore
 * @param session the session data to store
 */
export async function storeSession(session: StoredSession): Promise<void> {
    await Promise.all([
        SecureStore.setItemAsync(SESSION_KEYS.accessToken, session.accessToken),
        SecureStore.setItemAsync(SESSION_KEYS.refreshToken, session.refreshToken),
        SecureStore.setItemAsync(SESSION_KEYS.sessionId, session.sessionId),
        SecureStore.setItemAsync(SESSION_KEYS.userId, session.userId),
    ]);
}

/**
 * retrieves session data from keystore
 * @returns the existing session data or null
 */
export async function getSession(): Promise<StoredSession | null> {
    const [accessToken, refreshToken, sessionId, userId] = await Promise.all([
        SecureStore.getItemAsync(SESSION_KEYS.accessToken),
        SecureStore.getItemAsync(SESSION_KEYS.refreshToken),
        SecureStore.getItemAsync(SESSION_KEYS.sessionId),
        SecureStore.getItemAsync(SESSION_KEYS.userId),
    ]);

    if (!accessToken || !refreshToken || !sessionId || !userId) {
        return null;
    }

    return { accessToken, refreshToken, sessionId, userId };
}

/**
 * deletes session data from keystore
 * @returns a promise that is resolved when session data is deleted
 */
export async function deleteSession(): Promise<void> {
    await Promise.all([
        SecureStore.deleteItemAsync(SESSION_KEYS.accessToken),
        SecureStore.deleteItemAsync(SESSION_KEYS.refreshToken),
        SecureStore.deleteItemAsync(SESSION_KEYS.sessionId),
        SecureStore.deleteItemAsync(SESSION_KEYS.userId),
    ]);
}


// individual getters for all session data items
export async function getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(SESSION_KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(SESSION_KEYS.refreshToken);
}

export async function getSessionId(): Promise<string | null> {
    return SecureStore.getItemAsync(SESSION_KEYS.sessionId);
}

export async function getUserId(): Promise<string | null> {
    return SecureStore.getItemAsync(SESSION_KEYS.userId);
}

