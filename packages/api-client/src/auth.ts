import { LoginRequest, LoginResponse, LogoutRequest } from '@suppsense/shared-types';
import { apiFetch } from './http';

/**
 * handles the user login, sends credentials to backend for login
 * @param credentials users email and password
 * @returns accesstoken, refreshtoken, and sessionId
 */
export function login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
}

/**
 * handles user signup request
 * @param user_info users email and password, first name etc
 * @returns success/failure
 */
export function signup(user_info: SignupRequest): Promise<SignupResponse> {
    return apiFetch<SignupResponse>('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user_info),
    });
}

/**
 * handles user logout, sends userid and sessionid to backend for logout
 * @param session userid, and sessionid
 * @returns successful logout message
 */
export function logout(session: LogoutRequest): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
    });
}