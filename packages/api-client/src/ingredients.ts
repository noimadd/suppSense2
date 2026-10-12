import { getIngredientResponse, IngredientSearchResult } from "@suppsense/shared-types";
import { apiFetch } from "./http";
import { apiFetchWrapped, APIResponseWrap } from './http';

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

export function searchIngredients(user_token: string, name_part: string): Promise<Array<IngredientSearchResult>>
{
	return apiFetchWrapped<Array<IngredientSearchResult>>('/api/ingredients/search/' + name_part, {
		method: 'GET',
		headers: {
		    'Authorization': 'Bearer ' + user_token,
		    'Content-Type': 'application/json'
		},
	});	
}