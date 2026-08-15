import { LoginRequest, LoginResponse, LogoutRequest } from '@suppsense/shared-types';
import { apiFetch, apiFetchWrapped } from './http';

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
export function signup(user_info: SignupRequest): Promise<APIResponseWrap<SignupResponse>>
{
    return apiFetchWrapped<SignupResponse>('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user_info),
    });
}

/**
 * handles user email verification request
 * @param credentials users email and password
 * @returns success/failure
 */
export function email_verify_challenge(credentials: LoginRequest): Promise<APIResponseWrap<EmailChallengeResponse>> {
    return apiFetchWrapped<EmailChallengeResponse>('/api/auth/email_challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
}

/**
 * handles user email verification completion
 * @param code_pair users email and verification code
 * @returns success/failure
 */
export function complete_email_verify_challenge(credentials: CompleteChallengeRequest): Promise<APIResponseWrap<CompleteChallengeResponse>> {
    return apiFetchWrapped<CompleteChallengeResponse>('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
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