import { useId, useState } from 'react';
import { listAdminIngredients } from '@suppsense/api-client';
import type { AdminProduct, AdminProductPatch } from '@suppsense/shared-types';
import { useDebounced, useLoad } from '../lib/useLoad';

interface IngredientRow {
    key: number;
    /** set when the row came from the product and its name hasn't been changed */
    ingredient_id?: string;
    originalName?: string;
    name: string;
    amount: string;
}

export interface ProductDraft {
    name: string;
    brand: string;
    barcode: string;
    description: string;
    ingredients: IngredientRow[];
}

let nextKey = 1;

export function draftFromProduct(product: AdminProduct): ProductDraft {
    return {
        name: product.name,
        brand: product.brand ?? '',
        barcode: product.barcode,
        description: product.description ?? '',
        ingredients: product.ingredients.map((i) => ({
            key: nextKey++,
            ingredient_id: i.ingredient_id,
            originalName: i.name,
            name: i.name,
            amount: i.amount ?? '',
        })),
    };
}

/**
 * Converts the form into the API patch. Unchanged ingredient rows link by id,
 * renamed or new rows go by name (the server reuses or creates the ingredient).
 */
export function draftToPatch(draft: ProductDraft): AdminProductPatch {
    return {
        name: draft.name.trim(),
        brand: draft.brand.trim() || null,
        barcode: draft.barcode.trim(),
        description: draft.description.trim(),
        ingredients: draft.ingredients
            .filter((row) => row.name.trim())
            .map((row) => {
                const amount = row.amount.trim() || null;
                return row.ingredient_id && row.name.trim() === row.originalName
                    ? { ingredient_id: row.ingredient_id, amount }
                    : { name: row.name.trim(), amount };
            }),
    };
}

/**
 * @returns a message describing the first problem, or null if the draft can be saved
 */
export function validateDraft(draft: ProductDraft): string | null {
    if (!draft.name.trim()) { return 'The product needs a name.'; }
    if (!/^\d{1,30}$/.test(draft.barcode.trim())) { return 'The barcode must be 1 to 30 digits.'; }

    const seen = new Set<string>();
    for (const row of draft.ingredients) {
        const name = row.name.trim().toLowerCase();
        if (!name) { continue; }
        if (seen.has(name)) { return `"${row.name.trim()}" is listed more than once.`; }
        seen.add(name);
        if (row.amount.length > 50) { return `The amount for "${row.name.trim()}" is too long (50 characters max).`; }
    }
    return null;
}

export function isDraftChanged(draft: ProductDraft, original: AdminProduct): boolean {
    return JSON.stringify(draftToPatch(draft)) !== JSON.stringify(draftToPatch(draftFromProduct(original)));
}

/**
 * The editable product fields: name, brand, barcode, description and the ingredient list.
 * Controlled - the parent owns the draft so it can decide when to save.
 */
export function ProductForm({ draft, onChange, disabled }: { draft: ProductDraft; onChange: (draft: ProductDraft) => void; disabled?: boolean }) {
    const ids = useId();
    const [suggestFor, setSuggestFor] = useState('');
    const search = useDebounced(suggestFor, 200);
    const suggestions = useLoad(() => listAdminIngredients({ search, limit: 12 }), [search]);

    const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => onChange({ ...draft, [key]: value });

    const setRow = (key: number, changes: Partial<IngredientRow>) =>
        set('ingredients', draft.ingredients.map((row) => (row.key === key ? { ...row, ...changes } : row)));

    return (
        <fieldset className="product-form" disabled={disabled}>
            <div className="field-grid">
                <div className="field">
                    <label htmlFor={`${ids}-name`}>Product name</label>
                    <input id={`${ids}-name`} value={draft.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor={`${ids}-brand`}>Brand</label>
                    <input id={`${ids}-brand`} value={draft.brand} onChange={(e) => set('brand', e.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor={`${ids}-barcode`}>Barcode</label>
                    <input
                        id={`${ids}-barcode`}
                        className="numeric"
                        inputMode="numeric"
                        value={draft.barcode}
                        onChange={(e) => set('barcode', e.target.value)}
                    />
                </div>
            </div>

            <div className="field">
                <label htmlFor={`${ids}-desc`}>Description</label>
                <textarea id={`${ids}-desc`} rows={2} value={draft.description} onChange={(e) => set('description', e.target.value)} />
            </div>

            <div className="field">
                <span className="label">Ingredients and dosages</span>
                <datalist id={`${ids}-suggest`}>
                    {suggestions.data?.items.map((i) => <option key={i.id} value={i.name} />)}
                </datalist>

                {draft.ingredients.length === 0 && <p className="hint">No ingredients listed yet.</p>}

                <ul className="ingredient-rows">
                    {draft.ingredients.map((row, index) => (
                        <li key={row.key}>
                            <input
                                aria-label={`Ingredient ${index + 1} name`}
                                placeholder="Ingredient"
                                list={`${ids}-suggest`}
                                value={row.name}
                                onFocus={() => setSuggestFor(row.name)}
                                onChange={(e) => { setRow(row.key, { name: e.target.value }); setSuggestFor(e.target.value); }}
                            />
                            <input
                                aria-label={`Ingredient ${index + 1} amount`}
                                placeholder="Amount, e.g. 5g"
                                className="amount"
                                value={row.amount}
                                onChange={(e) => setRow(row.key, { amount: e.target.value })}
                            />
                            <button
                                type="button"
                                className="btn btn-quiet"
                                aria-label={`Remove ${row.name || `ingredient ${index + 1}`}`}
                                onClick={() => set('ingredients', draft.ingredients.filter((r) => r.key !== row.key))}
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>

                <button
                    type="button"
                    className="btn"
                    onClick={() => set('ingredients', [...draft.ingredients, { key: nextKey++, name: '', amount: '' }])}
                >
                    Add ingredient
                </button>
                <p className="hint">Names that don't match an existing ingredient are added as new, unverified ingredients.</p>
            </div>
        </fieldset>
    );
}
