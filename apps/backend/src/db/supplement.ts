import { pool } from './pool';

/**
 * contains a single ingredient and it's amount
 * each Product contains many of these
 */
export interface IngredientEntry {
    name: string;
    amount?: string;
}

/**
 * contains all of the information about a product from the db
 */
export interface Product {
    id: string;
    barcode: string;
    name: string;
    description: string;
    date_added: string;
    date_updated: string;
}

/**
 * gets a product from the db via its barcode
 * @param barcode the barcode of the product
 * @returns all product information
 */
export async function getProduct(barcode: string): Promise<Product | null> {
    const result = await pool.query<Product>(
        'SELECT * FROM products WHERE barcode = $1',
        [barcode]
    );
    return result.rows[0] ?? null;
}

/**
 * contains all ingredient info - matches the db ingredient schema
 */
export interface Ingredient {
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

/**
 * gets an ingredient from the db via it's name
 * @param name of the ingredient
 * @returns all ingredient information
 */
export async function getIngredient(name: string): Promise<Ingredient | null> {
    const result = await pool.query<Ingredient>(
        'SELECT * FROM ingredients WHERE name = $1',
        [name]
    );
    return result.rows[0] ?? null;
}

/**
 * contains all information about the linked productingredient table - matches schema of the same table
 */
export interface ProductIngredient {
    id: string;
    product_id: string;
    ingredient_id: string;
    amount: string | null;
}

/**
 * gets all ingredients linked to a product
 * @param productId the id of the product
 * @returns all linked ingredients and their quantities
 */
export async function getProductIngredients(productId: string): Promise<IngredientEntry[]> {
    const result = await pool.query<IngredientEntry>(
        `SELECT i.name, pi.amount
            FROM productingredients pi
            JOIN ingredients i ON i.id = pi.ingredient_id
            WHERE pi.product_id = $1`,
        [productId]
    );
    return result.rows;
}