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
