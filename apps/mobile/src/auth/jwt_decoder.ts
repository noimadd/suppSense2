import { jwtDecode } from 'jwt-decode';
import type { AccessTokenResponse } from '@suppsense/shared-types';

export function decodeAccessToken(token: string): AccessTokenResponse {
    try {
        return jwtDecode<AccessTokenResponse>(token);
    } catch {
        return {
            sub: '',
            email: '',
            userType: 'user',
            sid: '',
        };
    }
}