import { logout } from '@suppsense/api-client';
import { getSession, deleteSession } from './session_storage';

export async function handleLogout(): Promise<void> {
    const session = await getSession();

    if (session) {
        try {
            await logout({ userId: session.userId, sessionId: session.sessionId });
        } catch {} // ignore
    }

    await deleteSession();
}