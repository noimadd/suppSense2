import { getProductResponse } from "@suppsense/shared-types";
import { apiFetch } from "./http";

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