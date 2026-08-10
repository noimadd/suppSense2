// Authentication related types
export interface LoginRequest {
    username: string;
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


export interface Supplement {
    id: string;
}