import { pool } from './pool';

/**
* Contains some quick info about one of the products in a library
*/
export interface ProductEntry
{
	name: string,
	image_url: string,
	product_id: string,
}

/**
* Contains all of the info about a given library in the DB
*/
export interface ProductLibrary
{
	id: string,
	user_id: string,
	library_name: string,
	product_ids: ProductEntry[],
	image_url: string,
	date_added: string,
	date_updated: string,
}

/**
* Gets all libraries belonging to a given user
* @param user_id the id of the user to query for
* @returns all libraries
*/
export async function getProductLibrary(user_id: string): Promise<ProductLibrary[] | null>
{    
	const result = await pool.query<ProductLibrary>('SELECT * FROM librarydata WHERE user_id = $1', [user_id]);
	return result.rows ?? null;
}

/**
* Creates a new library belonging to the given user.
* @param user_id the id of the user who will own the library
* @param library_name the display name of the library the user has given 
* @param img_url An http/https url to an image resource which will be shown as the thumbnail for this library 
* @returns all libraries
*/
export async function createProductLibrary(user_id: string, library_name: string, img_url: string): Promise<void>
{
	const result = await pool.query<ProductLibrary>('INSERT INTO librarydata (user_id, library_name, product_ids, image_url, date_added) VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP)',
													[user_id, library_name, JSON.stringify([]), img_url]
													);
}

/**
* Creates a new library belonging to the given user.
* @param user_id the id of the user who owns the library - There to protect against unauthorized deletion
* @param library_id the id of the library to delete 
*/
export async function deleteProductLibrary(user_id: string, library_id: string): Promise<void>
{
	const result = await pool.query<ProductLibrary>('DELETE FROM librarydata WHERE librarydata.user_id = $1 AND librarydata.id = $2',
													[user_id, library_id]
													);
}