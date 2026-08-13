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
    ingredients: IngredientEntry[];
    data_added: string;
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