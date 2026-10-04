import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { Product } from '../db/supplement';
import { Paginated, HttpError, likePattern, buildSetClause } from './util';

export type ProductStatus = 'pending' | 'approved';

/**
 * One of a product's ingredients, as stored in ProductIngredients joined with Ingredients
 */
export interface AdminProductIngredient {
    ingredient_id: string;
    name: string;
    amount: string | null;
    verified: boolean;
}

/**
 * A product as the admin dashboard sees it, with its ingredients and the submitter's details joined in
 */
export interface AdminProduct extends Product {
    ingredients: AdminProductIngredient[];
    submitter_username: string | null;
    submitter_email: string | null;
}

/**
 * An ingredient line on the admin product form. Give ingredient_id to link an existing ingredient,
 * or just a name - an existing ingredient with that name (case-insensitive) is reused,
 * otherwise a new unverified one is created.
 */
export interface AdminProductIngredientInput {
    ingredient_id?: string;
    name?: string;
    amount?: string | null;
}

/**
 * Fields an admin is allowed to change on a product or submission.
 * ingredients, if given, replaces the product's whole ingredient list.
 */
export interface AdminProductPatch {
    name?: string;
    brand?: string | null;
    barcode?: string;
    description?: string;
    ingredients?: AdminProductIngredientInput[];
}

const EDITABLE_PRODUCT_COLUMNS = ['name', 'brand', 'barcode', 'description'] as const;

const PRODUCT_SELECT = `
    SELECT p.*,
           u.username AS submitter_username,
           u.email AS submitter_email,
           COALESCE(ing.list, '[]'::json) AS ingredients
    FROM products p
    LEFT JOIN users u ON u.id = p.submitted_by
    LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
                   'ingredient_id', i.id,
                   'name', i.name,
                   'amount', pi.amount,
                   'verified', i.verified
               ) ORDER BY i.name) AS list
        FROM productingredients pi
        JOIN ingredients i ON i.id = pi.ingredient_id
        WHERE pi.product_id = p.id
    ) ing ON true
`;

// $1 = status, $2 = ILIKE pattern or NULL
const PRODUCT_SEARCH_WHERE = `
    WHERE p.status = $1
      AND ($2::text IS NULL OR p.name ILIKE $2 OR p.brand ILIKE $2 OR p.barcode ILIKE $2)
`;

/**
 * lists products with the given status, optionally filtered by name/brand/barcode.
 * Pending submissions come back oldest first (it's a review queue), approved products most recently updated first.
 * @param status 'pending' for the admission queue, 'approved' for the public database
 * @param search free text search
 * @param limit max rows to return
 * @param offset rows to skip
 */
export async function searchProducts(status: ProductStatus, search: string | null, limit: number, offset: number): Promise<Paginated<AdminProduct>> {
    const pattern = likePattern(search);
    const order = status === 'pending' ? 'p.date_added ASC' : 'p.date_updated DESC NULLS LAST';

    const [rows, count] = await Promise.all([
        pool.query<AdminProduct>(
            `${PRODUCT_SELECT} ${PRODUCT_SEARCH_WHERE} ORDER BY ${order} LIMIT $3 OFFSET $4`,
            [status, pattern, limit, offset]
        ),
        pool.query<{ total: number }>(
            `SELECT COUNT(*)::int AS total FROM products p ${PRODUCT_SEARCH_WHERE}`,
            [status, pattern]
        ),
    ]);

    return { items: rows.rows, total: count.rows[0].total, limit, offset };
}

/**
 * gets a single product by id
 * @param id the product id
 * @param status if given, only returns the product when it has this status
 */
export async function getAdminProductById(id: string, status?: ProductStatus, client: PoolClient | typeof pool = pool): Promise<AdminProduct | null> {
    const result = await client.query<AdminProduct>(
        `${PRODUCT_SELECT} WHERE p.id = $1 AND ($2::text IS NULL OR p.status = $2)`,
        [id, status ?? null]
    );
    return result.rows[0] ?? null;
}

/**
 * Libraries keep a {product_id, name} snapshot of each product, so these keep them in sync.
 */
async function renameProductInLibraries(client: PoolClient, product_id: string, name: string): Promise<void> {
    await client.query(`
        UPDATE librarydata
        SET product_ids = (
            SELECT COALESCE(jsonb_agg(
                CASE WHEN e->>'product_id' = $1 THEN jsonb_set(e, '{name}', to_jsonb($2::text)) ELSE e END
            ), '[]'::jsonb)
            FROM jsonb_array_elements(librarydata.product_ids) AS e
        )
        WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(librarydata.product_ids) AS e WHERE e->>'product_id' = $1)
    `, [product_id, name]);
}

async function removeProductFromAllLibraries(client: PoolClient, product_id: string): Promise<void> {
    await client.query(`
        UPDATE librarydata
        SET product_ids = COALESCE(
            (SELECT jsonb_agg(e) FROM jsonb_array_elements(librarydata.product_ids) AS e WHERE e->>'product_id' <> $1),
            '[]'::jsonb
        )
        WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(librarydata.product_ids) AS e WHERE e->>'product_id' = $1)
    `, [product_id]);
}

/**
 * Finds an ingredient by name (case-insensitive), preferring a verified one, or creates a new unverified placeholder.
 * The placeholder has no description, so it shows up in Ingredient Management as needing a summary.
 * @returns the ingredient id
 */
async function findOrCreateIngredient(client: PoolClient, name: string): Promise<string> {
    const existing = await client.query<{ id: string }>(
        'SELECT id FROM ingredients WHERE lower(name) = lower($1) ORDER BY verified DESC, date_added ASC LIMIT 1',
        [name]
    );
    if (existing.rows[0]) { return existing.rows[0].id; }

    const created = await client.query<{ id: string }>(
        'INSERT INTO ingredients (name) VALUES ($1) RETURNING id',
        [name]
    );
    return created.rows[0].id;
}

/**
 * Replaces a product's entire ingredient list in ProductIngredients.
 * Throws a 400 if an ingredient_id doesn't exist or the same ingredient is listed twice.
 */
async function replaceProductIngredients(client: PoolClient, product_id: string, entries: AdminProductIngredientInput[]): Promise<void> {
    const ids: string[] = [];
    const amounts: (string | null)[] = [];

    for (const entry of entries) {
        let id: string;
        if (entry.ingredient_id) {
            const found = await client.query('SELECT 1 FROM ingredients WHERE id = $1', [entry.ingredient_id]);
            if (!found.rowCount) {
                throw new HttpError(400, `Ingredient ${entry.ingredient_id} does not exist.`);
            }
            id = entry.ingredient_id;
        } else {
            id = await findOrCreateIngredient(client, entry.name!.trim());
        }

        if (ids.includes(id)) {
            throw new HttpError(400, `The ingredient '${entry.name ?? entry.ingredient_id}' is listed more than once.`);
        }
        ids.push(id);
        amounts.push(entry.amount?.trim() || null);
    }

    await client.query('DELETE FROM productingredients WHERE product_id = $1', [product_id]);
    if (ids.length) {
        await client.query(
            `INSERT INTO productingredients (product_id, ingredient_id, amount)
             SELECT $1, ingredient_id, amount FROM unnest($2::uuid[], $3::varchar[]) AS t(ingredient_id, amount)`,
            [product_id, ids, amounts]
        );
    }
}

/**
 * Deletes ingredients from the given list that are untouched placeholders (unverified, no description)
 * and no longer linked to any product. Stops rejected submissions leaving junk ingredients behind.
 */
async function deleteOrphanedPlaceholderIngredients(client: PoolClient, ingredient_ids: string[]): Promise<void> {
    if (!ingredient_ids.length) { return; }
    await client.query(`
        DELETE FROM ingredients i
        WHERE i.id = ANY($1::uuid[])
          AND i.verified = FALSE
          AND i.description IS NULL
          AND NOT EXISTS (SELECT 1 FROM productingredients pi WHERE pi.ingredient_id = i.id)
    `, [ingredient_ids]);
}

async function getLinkedIngredientIds(client: PoolClient, product_id: string): Promise<string[]> {
    const result = await client.query<{ ingredient_id: string }>(
        'SELECT ingredient_id FROM productingredients WHERE product_id = $1',
        [product_id]
    );
    return result.rows.map((r) => r.ingredient_id);
}

/**
 * Applies a patch inside an existing transaction. Shared by the edit and accept flows.
 * @returns false if the product (with the required status) doesn't exist
 */
async function applyProductPatch(client: PoolClient, id: string, status: ProductStatus, patch: AdminProductPatch): Promise<boolean> {
    const set = buildSetClause(patch as Record<string, unknown>, EDITABLE_PRODUCT_COLUMNS, 3);
    const result = await client.query(
        `UPDATE products SET ${set ? set.clause + ', ' : ''}date_updated = CURRENT_TIMESTAMP WHERE id = $1 AND status = $2`,
        [id, status, ...(set?.values ?? [])]
    );
    if (!result.rowCount) { return false; }

    if (patch.ingredients !== undefined) {
        const previous = await getLinkedIngredientIds(client, id);
        await replaceProductIngredients(client, id, patch.ingredients);
        await deleteOrphanedPlaceholderIngredients(client, previous);
    }
    if (patch.name !== undefined) {
        await renameProductInLibraries(client, id, patch.name);
    }
    return true;
}

/**
 * Two approved products sharing a barcode would make barcode lookups ambiguous, so block it.
 */
async function assertBarcodeFree(client: PoolClient, id: string): Promise<void> {
    const clash = await client.query(`
        SELECT 1 FROM products other, products self
        WHERE self.id = $1 AND other.id <> self.id AND other.status = 'approved' AND other.barcode = self.barcode
    `, [id]);
    if (clash.rowCount) {
        throw new HttpError(409, 'An approved product with this barcode already exists.');
    }
}

async function inTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await work(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * edits a product or pending submission
 * @param id the product id
 * @param status the status the product must currently have
 * @param patch fields to change
 * @returns the updated product, or null if it doesn't exist
 */
export async function updateProduct(id: string, status: ProductStatus, patch: AdminProductPatch): Promise<AdminProduct | null> {
    return inTransaction(async (client) => {
        if (!(await applyProductPatch(client, id, status, patch))) { return null; }
        if (status === 'approved' && patch.barcode !== undefined) {
            await assertBarcodeFree(client, id);
        }
        return getAdminProductById(id, undefined, client);
    });
}

/**
 * accepts a pending submission, publishing it for all users. Optionally applies last-minute edits first,
 * so the admin can fix up the form and accept in one click.
 * @param id the submission id
 * @param patch optional edits to apply before accepting
 * @returns the now-approved product, or null if there was no such pending submission
 */
export async function acceptSubmission(id: string, patch: AdminProductPatch = {}): Promise<AdminProduct | null> {
    return inTransaction(async (client) => {
        if (!(await applyProductPatch(client, id, 'pending', patch))) { return null; }
        await assertBarcodeFree(client, id);
        await client.query(`UPDATE products SET status = 'approved', date_updated = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        return getAdminProductById(id, undefined, client);
    });
}

/**
 * permanently deletes a product (or rejects a submission) and removes it from every library it was saved in.
 * Its ProductIngredients rows go with it via ON DELETE CASCADE.
 * @param id the product id
 * @param status the status the product must currently have
 * @returns true if something was deleted
 */
export async function deleteProduct(id: string, status: ProductStatus): Promise<boolean> {
    return inTransaction(async (client) => {
        const linked = await getLinkedIngredientIds(client, id);
        const result = await client.query('DELETE FROM products WHERE id = $1 AND status = $2', [id, status]);
        if (!result.rowCount) { return false; }
        await removeProductFromAllLibraries(client, id);
        await deleteOrphanedPlaceholderIngredients(client, linked);
        return true;
    });
}