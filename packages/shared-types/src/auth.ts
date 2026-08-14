// shared types required for authentication


// ----------------------- sign-up -------------------

export interface SignupRequest {
    f_name: string,
    l_name: string,
    email: string,
    u_name: string,
    password: string,
}

export interface SignupResponse {
    success: boolean;
    message: string
}

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