// shared types required for displaying information 
// about products and their ingredients

// ----------- Product -------------
export interface IngredientEntry {
    name: string;
    amount?: string;
}

export interface getProductResponse {
    id: string;
    barcode: string;
    name: string;
    description: string;
    ingredients: IngredientEntry[];
    data_added: string;
    date_updated: string;
}



// --------- product/ingredient link ---------
export interface linkIngredientRequest {
    productId: string;
    ingredientId: string;
    amount?: string;
}



// ----------- Ingredient -------- 
export interface getIngredientResponse {
    id: string;
    name: string;
    description: string;
    paper_url: string;
    recommended_dosage: string;
    maximum_dosage: string;
    verified: boolean;
    image_url: string;
    date_added: string;
    date_updated: string;
}