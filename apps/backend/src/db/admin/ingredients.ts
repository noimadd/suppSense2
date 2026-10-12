import type { PoolClient } from 'pg';
import { pool } from '../pool';
import { Paginated, HttpError, likePattern, buildSetClause } from './util';
import type { AdminIngredient, AdminIngredientPatch, AdminIngredientCreate } from '@suppsense/shared-types/';
export type { AdminIngredient, AdminIngredientPatch };

const EDITABLE_INGREDIENT_COLUMNS = ['name', 'description', 'paper_url', 'recommended_dosage', 'maximum_dosage', 'image_url', 'verified'] as const;

const INGREDIENT_SELECT = `
    SELECT i.*,
           (SELECT COUNT(*) FROM productingredients pi WHERE pi.ingredient_id = i.id)::int AS product_count
    FROM ingredients i
`;

// $1 = ILIKE pattern or NULL, $2 = verified filter or NULL
const INGREDIENT_SEARCH_WHERE = `
    WHERE ($1::text IS NULL OR i.name ILIKE $1)
      AND ($2::boolean IS NULL OR i.verified = $2)
`;

/**
 * The mobile app looks ingredients up by exact name, so two ingredients with the same name would be ambiguous.
 * Throws a 409 if another ingredient already has this name (case-insensitive).
 */
async function assertNameFree(client: PoolClient | typeof pool, name: string, exclude_id: string | null): Promise<void> {
    const clash = await client.query(
        'SELECT 1 FROM ingredients WHERE lower(name) = lower($1) AND ($2::uuid IS NULL OR id <> $2)',
        [name, exclude_id]
    );
    if (clash.rowCount) {
        throw new HttpError(409, `An ingredient called '${name}' already exists.`);
    }
}

/**
 * lists ingredients alphabetically, optionally filtered by name and verification status
 * @param search free text search on the name
 * @param verified true/false to filter by human verification, null for all
 * @param limit max rows to return
 * @param offset rows to skip
 */
export async function searchIngredients(search: string | null, verified: boolean | null, limit: number, offset: number): Promise<Paginated<AdminIngredient>> {
    const pattern = likePattern(search);

    const [rows, count] = await Promise.all([
        pool.query<AdminIngredient>(
            `${INGREDIENT_SELECT} ${INGREDIENT_SEARCH_WHERE} ORDER BY i.name ASC LIMIT $3 OFFSET $4`,
            [pattern, verified, limit, offset]
        ),
        pool.query<{ total: number }>(
            `SELECT COUNT(*)::int AS total FROM ingredients i ${INGREDIENT_SEARCH_WHERE}`,
            [pattern, verified]
        ),
    ]);

    return { items: rows.rows, total: count.rows[0].total, limit, offset };
}

/**
 * gets a single ingredient by id
 * @param id the ingredient id
 */
export async function getIngredientById(id: string): Promise<AdminIngredient | null> {
    const result = await pool.query<AdminIngredient>(`${INGREDIENT_SELECT} WHERE i.id = $1`, [id]);
    return result.rows[0] ?? null;
}

/**
 * creates a new ingredient
 * @param fields the ingredient's details - name is required
 * @returns the new ingredient
 */
export async function createIngredient(fields: AdminIngredientCreate): Promise<AdminIngredient> {
    await assertNameFree(pool, fields.name, null);

    const columns = EDITABLE_INGREDIENT_COLUMNS.filter((c) => fields[c] !== undefined);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const created = await pool.query<{ id: string }>(
        `INSERT INTO ingredients (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`,
        columns.map((c) => fields[c])
    );
    return (await getIngredientById(created.rows[0].id))!;
}

/**
 * edits an ingredient's name, summary, dosages and/or its human verified flag.
 * Renaming is safe because products link to ingredients by id through ProductIngredients.
 * @param id the ingredient id
 * @param patch fields to change
 * @returns the updated ingredient, or null if it doesn't exist
 */
export async function updateIngredient(id: string, patch: AdminIngredientPatch): Promise<AdminIngredient | null> {
    if (patch.name !== undefined) {
        await assertNameFree(pool, patch.name, id);
    }

    const set = buildSetClause(patch as Record<string, unknown>, EDITABLE_INGREDIENT_COLUMNS, 2);
    const result = await pool.query(
        `UPDATE ingredients SET ${set ? set.clause + ', ' : ''}date_updated = CURRENT_TIMESTAMP WHERE id = $1`,
        [id, ...(set?.values ?? [])]
    );
    return result.rowCount ? getIngredientById(id) : null;
}

/**
 * permanently deletes an ingredient. It is removed from every product that lists it (ON DELETE CASCADE).
 * @param id the ingredient id
 * @returns true if it existed
 */
export async function deleteIngredient(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM ingredients WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
}