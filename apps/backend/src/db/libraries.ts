import { pool } from './pool';

/**
 * Contains some quick info about one of the products in a library
 */
export interface ProductEntry {
    name: string,
    image_url: string,
    product_id: string,
}

/**
 * Contains all of the info about a given library in the DB
 */
export interface ProductLibrary {
    id: string,
    user_id: string,
    library_name: string,
    product_ids: string,
    image_url: string,
    date_added: string,
    date_updated: string,
}

/**
 * Gets all libraries belonging to a given user
 * @param user_id the id of the user to query for
 * @returns all libraries
 */
export async function getProductLibrary(user_id: string): Promise<ProductLibrary[] | null> {
    
    const result = await pool.query<ProductLibrary>(
        'SELECT * FROM librarydata WHERE user_id = $1',
        [user_id]
    );
    
    return result.rows ?? null;
}
