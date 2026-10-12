import {
    LoginRequest, LoginResponse, LogoutRequest,
    SignupRequest, SignupResponse, EmailChallengeResponse,
    CompleteChallengeRequest, CompleteChallengeResponse,
} from '@suppsense/shared-types';
import {
    RefreshRequest, RefreshResponse,
} from '@suppsense/shared-types/src/admin';
import { apiFetch, apiFetchWrapped, APIResponseWrap } from './http';

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
export function signup(user_info: SignupRequest): Promise<APIResponseWrap<SignupResponse> | null>
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
export function email_verify_challenge(credentials: LoginRequest): Promise<APIResponseWrap<EmailChallengeResponse> | null> {
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
export function complete_email_verify_challenge(credentials: CompleteChallengeRequest): Promise<APIResponseWrap<CompleteChallengeResponse> | null> {
    return apiFetchWrapped<CompleteChallengeResponse>('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
}

/**
 * gets a new access token using the refresh token from login
 * @param session userId, sessionId and refreshToken
 * @returns a new access token
 */
export function refreshAccessToken(session: RefreshRequest): Promise<RefreshResponse> {
    return apiFetch<RefreshResponse>('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
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