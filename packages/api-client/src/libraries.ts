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
  }
 );
}

export function get_user_library(user_token: string, library_id: string): Promise<APIResponseWrap<ProductLibrary>>
{
 return apiFetchWrapped<ProductLibrary>('/api/libraries/' + library_id, {
   method: 'GET',
   headers: {
    'Authorization': 'Bearer ' + user_token,
    'Content-Type': 'application/json'
   },
  }
 );
}