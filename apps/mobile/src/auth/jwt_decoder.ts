import { jwtDecode } from 'jwt-decode';
import type { AccessTokenResponse } from '@suppsense/shared-types';

/**
 * decodes the access token returning the data as an object
 * this is done so we can retrieve the userId and userType since these are not included within the refresh token
 * @param token the token to decode
 * @returns the decoded token data
 */
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