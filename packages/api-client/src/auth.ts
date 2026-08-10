import { LoginRequest, LoginResponse } from '@suppsense/shared-types';
import { apiFetch } from './http';

export function login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
}