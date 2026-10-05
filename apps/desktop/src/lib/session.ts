import { useSyncExternalStore } from 'react';
import { ApiError, configureApiClient, login, logout, refreshAccessToken } from '@suppsense/api-client';
import type { AccessTokenResponse } from '@suppsense/shared-types';

/**
 * Everything the dashboard keeps in localStorage between visits
 */
export interface Session {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    userId: string;
    email: string;
}

type TokenClaims = AccessTokenResponse & { exp: number };

const STORAGE_KEY = 'suppsense.admin.session';
// refresh a little before the access token actually expires
const REFRESH_MARGIN_MS = 30_000;

// ------------------------------------------------------------------
// Storage
// ------------------------------------------------------------------

function readStored(): Session | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) { return null; }
        const parsed = JSON.parse(raw);
        const valid = ['accessToken', 'refreshToken', 'sessionId', 'userId', 'email'].every((k) => typeof parsed?.[k] === 'string');
        return valid ? parsed : null;
    } catch {
        return null;
    }
}

function writeStored(session: Session | null) {
    try {
        if (session) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // storage full or disabled - the session still works for this tab
    }
}

/**
 * Reads the claims out of a JWT without verifying it (the server does that).
 */
export function decodeToken(token: string): TokenClaims | null {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

// ------------------------------------------------------------------
// Current session + subscribers (so React re-renders on sign in/out)
// ------------------------------------------------------------------

let current: Session | null = readStored();
let signOutReason: string | null = null;
const listeners = new Set<() => void>();

function setSession(session: Session | null, reason: string | null = null) {
    current = session;
    signOutReason = session ? null : reason;
    writeStored(session);
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

// signing out in one tab signs out every tab
window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
        current = readStored();
        listeners.forEach((l) => l());
    }
});

export function useSession(): Session | null {
    return useSyncExternalStore(subscribe, () => current);
}

/**
 * Why the admin was last signed out, if it wasn't their choice (shown on the login page)
 */
export function takeSignOutReason(): string | null {
    const reason = signOutReason;
    signOutReason = null;
    return reason;
}

configureApiClient(async () => current?.accessToken ?? null, {
    baseUrl: import.meta.env.VITE_API_URL,
});

// ------------------------------------------------------------------
// Sign in / out
// ------------------------------------------------------------------

/**
 * Logs in with the shared login route and keeps the session only if the account is an admin.
 * Throws with a message suitable for showing on the login form.
 */
export async function signIn(email: string, password: string): Promise<void> {
    const tokens = await login({ email: email.trim(), password });
    const claims = decodeToken(tokens.accessToken);
    if (!claims) {
        throw new Error('The server sent back a token the dashboard could not read.');
    }

    if (claims.userType !== 'admin') {
        // don't leave a live session behind for a non-admin
        await logout({ userId: claims.sub, sessionId: tokens.sessionId }).catch(() => {});
        throw new Error('This account does not have admin access. Sign in with an admin account.');
    }

    setSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        sessionId: tokens.sessionId,
        userId: claims.sub,
        email: claims.email,
    });
}

/**
 * Clears the local session straight away, then tells the server to drop it.
 */
export function signOut(reason: string | null = null) {
    const session = current;
    setSession(null, reason);
    if (session) {
        logout({ userId: session.userId, sessionId: session.sessionId }).catch(() => {});
    }
}

// ------------------------------------------------------------------
// Requests with automatic token refresh
// ------------------------------------------------------------------

let refreshing: Promise<boolean> | null = null;

/**
 * Swaps the refresh token for a new access token. Concurrent callers share one refresh.
 * @returns false if the session is no longer valid (and has been cleared)
 */
function refreshSession(): Promise<boolean> {
    if (!refreshing) {
        refreshing = (async () => {
            const session = current;
            if (!session) { return false; }
            try {
                const { accessToken } = await refreshAccessToken({
                    userId: session.userId,
                    sessionId: session.sessionId,
                    refreshToken: session.refreshToken,
                });
                // only apply it if nobody signed out/in while we were waiting
                if (current?.sessionId === session.sessionId) {
                    setSession({ ...current, accessToken });
                }
                return true;
            } catch (err) {
                if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
                    setSession(null, 'Your session expired. Sign in again.');
                }
                // network errors keep the session - the next request will try again
                return false;
            }
        })().finally(() => { refreshing = null; });
    }
    return refreshing;
}

function expiresSoon(token: string): boolean {
    const claims = decodeToken(token);
    return !claims || claims.exp * 1000 - Date.now() < REFRESH_MARGIN_MS;
}

/**
 * Runs an api-client call, refreshing the access token first if it's about to expire,
 * and once more if the server still rejects it. Every admin API call goes through this.
 *
 *   const users = await request(() => listAdminUsers({ search }));
 */
export async function request<T>(call: () => Promise<T>): Promise<T> {
    if (current && expiresSoon(current.accessToken)) {
        await refreshSession();
    }

    try {
        return await call();
    } catch (err) {
        if (!(err instanceof ApiError) || !current) { throw err; }

        // 403 from /api/admin means this account is no longer an admin
        if (err.status === 403) {
            setSession(null, 'Your account no longer has admin access.');
            throw err;
        }
        // 401 is usually an expired token. (Wrong password confirmations are also 401 -
        // the retry just fails the same way and the error is shown as normal.)
        if (err.status === 401 && await refreshSession()) {
            return call();
        }
        throw err;
    }
}
