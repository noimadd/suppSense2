import { pool } from './pool';

/**
 * contains a single ingredient and it's amount
 * each Product contains many of these
 */
export interface IngredientEntry {
    id: string;
    name: string;
    amount: number;
    unit: string;
}

/**
 * contains all of the information about a product from the db
 */
export interface Product {
    id: string;
    barcode: string;
    name: string;
    brand: string | null;
    description: string;
    status: 'pending' | 'approved';
    submitted_by: string | null;
    date_added: string;
    date_updated: string;
}

/**
 * gets a product from the db via its barcode.
 * Pending submissions are only visible to the user who submitted them,
 * and an approved product always wins over the user's own pending one.
 * @param barcode the barcode of the product
 * @param user_id the id of the user doing the lookup
 * @returns all product information
 */
export async function getProduct(barcode: string, user_id: string): Promise<Product | null> {
    const result = await pool.query<Product>(
        `SELECT * FROM products
         WHERE barcode = $1 AND (status = 'approved' OR submitted_by = $2)
         ORDER BY (status = 'approved') DESC
         LIMIT 1`,
        [barcode, user_id]
    );
    return result.rows[0] ?? null;
}

/**
* Gets a product from the db via its GUID.
* Same as for getProduct, but it is garuanteed to always return the same
* product.
* @param product_id the guid of the product
* @user_id the ID of the user doing the lookup
* @returns all information about the product
*/
export async function getProductById(product_id: string, user_id: string): Promise<Product | null> {
    const result = await pool.query<Product>(
        `SELECT * FROM products
         WHERE id = $1 AND (status = 'approved' OR submitted_by = $2)
         `,
        [product_id, user_id]
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
    amount: number;
    unit: string;
}

/**
 * gets all ingredients linked to a product
 * @param productId the id of the product
 * @returns all linked ingredients and their quantities
 */
export async function getProductIngredients(productId: string): Promise<IngredientEntry[]> {
    const result = await pool.query<IngredientEntry>(
        `SELECT i.id, i.name, pi.amount, pi.unit
            FROM productingredients pi
            JOIN ingredients i ON i.id = pi.ingredient_id
            WHERE pi.product_id = $1`,
        [productId]
    );
    return result.rows;
}