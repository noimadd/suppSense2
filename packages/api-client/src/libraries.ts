import { ProductLibrary, ProductEntry } from '@suppsense/shared-types';
import { apiFetchWrapped, APIResponseWrap } from './http';

/**
 * Gets the list of product libraries belonging to the user
 * @param user_token user's auth token
 * @returns success/failure
 */
export function get_user_libraries(user_token: string): Promise<APIResponseWrap<Array<ProductLibrary>> | null>
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

export function get_user_library(user_token: string, library_id: string): Promise<APIResponseWrap<ProductLibrary> | null>
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

export function create_user_library(user_token: string, library_name: string): Promise<APIResponseWrap<null>>
{
    const body = {'library_name': library_name};
    return apiFetchWrapped<null>('/api/libraries/create', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + user_token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
     }
    );
}

export function add_product_to_user_library(user_token: string, library_id: string, product_id: string): Promise<APIResponseWrap<null>>
{
 const body = {'library_id': library_id, 'product_id': product_id};
 return apiFetchWrapped<null>('/api/libraries/insert_product', {
   method: 'POST',
   headers: {
    'Authorization': 'Bearer ' + user_token,
    'Content-Type': 'application/json'
   },
   body: JSON.stringify(body),
  }
 );
}