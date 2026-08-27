import { ProductLibrary, ProductEntry } from '@suppsense/shared-types';
import { apiFetchWrapped } from './http';

/**
 * Gets the list of product libraries belonging to the user
 * @param user_token user's auth token
 * @returns success/failure
 */
export function get_user_libraries(user_token: string): Promise<APIResponseWrap<Array<ProductLibrary>>>
{
    return apiFetchWrapped<Array<ProductLibrary>>('/api/libraries', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + user_token,
            'Content-Type': 'application/json'
        },
    });
}