// shared types required for authentication


// ----------------------- sign-up -------------------


// ------------------------ login ----------------------
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
}

export interface ApiErrorResponse {
    message: string;
}

export interface AccessTokenResponse {
    sub: string;
    email: string;
    userType: 'user' | 'admin';
    sid: string;
}

// -------------------- logout ----------------
export interface LogoutRequest {
    userId: string;
    sessionId: string;
}