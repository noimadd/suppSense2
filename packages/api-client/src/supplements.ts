import { getProductResponse } from "@suppsense/shared-types";
import { apiFetch, apiFetchWrapped } from "./http";

/**
 * looks up a product via it's barcode
 * @param barcode the scanned or entered barcode
 * @returns all product information
 */
export function getProductByBarcode(barcode: string): Promise<getProductResponse> {
    return apiFetch<getProductResponse>(`/api/supplements/${barcode}`, {
        method: 'GET',
    });
}

export function getProductById(user_token: string, id: string) : Promise<APIResponseWrap<getProductResponse>>
{
 return apiFetchWrapped<getProductResponse>('/api/supplements/by_id/' + id, {
   method: 'GET',
   headers: {
    'Authorization': 'Bearer ' + user_token,
    'Content-Type': 'application/json'
   },
  }
 );
}