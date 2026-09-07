import { getIngredientResponse } from "@suppsense/shared-types";
import { apiFetch } from "./http";

/**
 * looks up an ingredient via its name
 * @param name of the ingredient
 * @returns all ingredient related info
 */
export function getIngredientByName(name: string): Promise<getIngredientResponse> {
    return apiFetch<getIngredientResponse>(`/api/ingredients/${encodeURIComponent(name)}`, {
        method: 'GET',
    });
}