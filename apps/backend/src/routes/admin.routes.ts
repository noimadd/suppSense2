import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { confirmAdminPassword } from '../middleware/admin.middleware';
import { deleteAllSessions } from '../auth/sessions';
import { getUserById } from '../db/users';
import { HttpError } from '../db/admin/util';
import { getDashboardStats, getDashboardActivity } from '../db/admin/stats';
import { searchUsers, getAdminUserById, updateUser, deleteUser, AdminUserPatch } from '../db/admin/users';
import { searchProducts, getAdminProductById, updateProduct, acceptSubmission, deleteProduct, AdminProductPatch } from '../db/admin/products';
import { searchIngredients, getIngredientById, createIngredient, updateIngredient, deleteIngredient, AdminIngredientPatch } from '../db/admin/ingredients';

// Mounted at /api/admin behind requireAuth + requireAdmin (see server.ts),
// so every handler here can rely on req.user (JWT claims) and req.admin (DB row).
const router = Router();

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const MAX_ACTIVITY_DAYS = 90;

// ------------------------------------------------------------------
// Request parsing helpers
// ------------------------------------------------------------------

function queryString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = Number.parseInt(typeof value === 'string' ? value : '', 10);
    if (Number.isNaN(parsed)) { return fallback; }
    return Math.min(Math.max(parsed, min), max);
}

function pagination(query: any): { limit: number; offset: number } {
    return {
        limit: clampInt(query.limit, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE),
        offset: clampInt(query.offset, 0, 0, Number.MAX_SAFE_INTEGER),
    };
}

function queryBoolean(value: unknown): boolean | null {
    if (value === 'true') { return true; }
    if (value === 'false') { return false; }
    return null;
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/**
 * Copies whitelisted fields out of a request body, validating each one.
 * Throws a 400 if a field is present but invalid.
 */
function pickFields<T>(body: any, validators: Record<string, (v: unknown) => boolean>): T {
    const out: Record<string, unknown> = {};
    for (const [field, isValid] of Object.entries(validators)) {
        if (body?.[field] === undefined) { continue; }
        if (!isValid(body[field])) {
            throw new HttpError(400, `Invalid value for '${field}'.`);
        }
        out[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
    return out as T;
}

// Each entry needs an ingredient_id (link an existing ingredient) or a name (find or create one by name)
function isIngredientList(v: unknown): boolean {
    return Array.isArray(v) && v.every((entry) =>
        entry && typeof entry === 'object' &&
        (isNonEmptyString(entry.ingredient_id) || isNonEmptyString(entry.name)) &&
        (entry.amount === undefined || entry.amount === null || (isString(entry.amount) && entry.amount.length <= 50))
    );
}

const USER_PATCH_FIELDS = {
    first_name: isNonEmptyString,
    last_name: isNonEmptyString,
    email: (v: unknown) => isString(v) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    username: isNonEmptyString,
    user_type: (v: unknown) => v === 'user' || v === 'admin',
    email_verified: (v: unknown) => typeof v === 'boolean',
};

const PRODUCT_PATCH_FIELDS = {
    name: isNonEmptyString,
    brand: (v: unknown) => v === null || isString(v),
    barcode: (v: unknown) => isString(v) && /^\d{1,30}$/.test(v.trim()),
    description: isString,
    ingredients: isIngredientList,
};

const INGREDIENT_PATCH_FIELDS = {
    name: isNonEmptyString,
    description: isString,
    paper_url: isString,
    recommended_dosage: isString,
    maximum_dosage: isString,
    image_url: isString,
    verified: (v: unknown) => typeof v === 'boolean',
};

function notFound(res: Response, what: string) {
    return res.status(404).json({ message: `${what} not found.` });
}

async function requirePasswordConfirmation(req: Request) {
    if (!(await confirmAdminPassword(req))) {
        throw new HttpError(401, 'Password confirmation failed.');
    }
}

// ------------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------------

// Stat cards: registered users, pending submissions, products tracked, ingredients tracked
router.get('/stats', async (_req, res) => {
    res.json(await getDashboardStats());
});

// Chart data: new users + new submissions per day. ?days=14 (default 7, max 90)
router.get('/stats/activity', async (req, res) => {
    const days = clampInt(req.query.days, 7, 1, MAX_ACTIVITY_DAYS);
    res.json(await getDashboardActivity(days));
});

// ------------------------------------------------------------------
// User Management
// ------------------------------------------------------------------

// ?search=&limit=&offset=
router.get('/users', async (req, res) => {
    const { limit, offset } = pagination(req.query);
    res.json(await searchUsers(queryString(req.query.search), limit, offset));
});

router.get('/users/:id', async (req, res) => {
    const user = await getAdminUserById(req.params.id);
    if (!user) { return notFound(res, 'User'); }
    res.json(user);
});

// body: any of first_name, last_name, email, username, user_type, email_verified
router.patch('/users/:id', async (req: any, res) => {
    const patch = pickFields<AdminUserPatch>(req.body, USER_PATCH_FIELDS);

    if (req.params.id === req.admin.id && patch.user_type === 'user') {
        return res.status(400).json({ message: 'You cannot remove your own admin access.' });
    }

    const user = await updateUser(req.params.id, patch);
    if (!user) { return notFound(res, 'User'); }

    // Their existing JWT/session still carries the old userType, so make them log in again.
    if (patch.user_type !== undefined || patch.email !== undefined) {
        await deleteAllSessions(user.id);
    }

    res.json(user);
});

// body: { password } - the admin's own password, to confirm
router.delete('/users/:id', async (req: any, res) => {
    if (req.params.id === req.admin.id) {
        return res.status(400).json({ message: 'You cannot delete your own account from the dashboard.' });
    }

    await requirePasswordConfirmation(req);

    const deleted = await deleteUser(req.params.id);
    if (!deleted) { return notFound(res, 'User'); }

    await deleteAllSessions(req.params.id);
    res.json({ message: 'User deleted.' });
});

// ------------------------------------------------------------------
// Supplement Admission (pending user submissions)
// ------------------------------------------------------------------

// Oldest first. ?search=&limit=&offset=
router.get('/submissions', async (req, res) => {
    const { limit, offset } = pagination(req.query);
    res.json(await searchProducts('pending', queryString(req.query.search), limit, offset));
});

router.get('/submissions/:id', async (req, res) => {
    const product = await getAdminProductById(req.params.id, 'pending');
    if (!product) { return notFound(res, 'Submission'); }
    res.json(product);
});

// body: any of name, brand, barcode, description, ingredients
router.patch('/submissions/:id', async (req, res) => {
    const patch = pickFields<AdminProductPatch>(req.body, PRODUCT_PATCH_FIELDS);
    const product = await updateProduct(req.params.id, 'pending', patch);
    if (!product) { return notFound(res, 'Submission'); }
    res.json(product);
});

// body (optional): same fields as PATCH, applied before accepting
router.post('/submissions/:id/accept', async (req, res) => {
    const patch = pickFields<AdminProductPatch>(req.body, PRODUCT_PATCH_FIELDS);
    const product = await acceptSubmission(req.params.id, patch);
    if (!product) { return notFound(res, 'Submission'); }
    res.json(product);
});

router.post('/submissions/:id/reject', async (req, res) => {
    const deleted = await deleteProduct(req.params.id, 'pending');
    if (!deleted) { return notFound(res, 'Submission'); }
    res.json({ message: 'Submission rejected.' });
});

// ------------------------------------------------------------------
// Supplement Management (approved products)
// ------------------------------------------------------------------

// Most recently updated first. ?search=&limit=&offset=
router.get('/products', async (req, res) => {
    const { limit, offset } = pagination(req.query);
    res.json(await searchProducts('approved', queryString(req.query.search), limit, offset));
});

router.get('/products/:id', async (req, res) => {
    const product = await getAdminProductById(req.params.id, 'approved');
    if (!product) { return notFound(res, 'Product'); }
    res.json(product);
});

// body: any of name, brand, barcode, description, ingredients
router.patch('/products/:id', async (req, res) => {
    const patch = pickFields<AdminProductPatch>(req.body, PRODUCT_PATCH_FIELDS);
    const product = await updateProduct(req.params.id, 'approved', patch);
    if (!product) { return notFound(res, 'Product'); }
    res.json(product);
});

// body: { password } - the admin's own password, to confirm
router.delete('/products/:id', async (req, res) => {
    await requirePasswordConfirmation(req);
    const deleted = await deleteProduct(req.params.id, 'approved');
    if (!deleted) { return notFound(res, 'Product'); }
    res.json({ message: 'Product deleted.' });
});

// ------------------------------------------------------------------
// Ingredient Management
// ------------------------------------------------------------------

// Alphabetical. ?search=&verified=true|false&limit=&offset=
router.get('/ingredients', async (req, res) => {
    const { limit, offset } = pagination(req.query);
    res.json(await searchIngredients(queryString(req.query.search), queryBoolean(req.query.verified), limit, offset));
});

router.get('/ingredients/:id', async (req, res) => {
    const ingredient = await getIngredientById(req.params.id);
    if (!ingredient) { return notFound(res, 'Ingredient'); }
    res.json(ingredient);
});

// body: name (required) plus any of description, paper_url, recommended_dosage, maximum_dosage, image_url, verified
router.post('/ingredients', async (req, res) => {
    const fields = pickFields<AdminIngredientPatch>(req.body, INGREDIENT_PATCH_FIELDS);
    if (!fields.name) {
        return res.status(400).json({ message: 'An ingredient needs a name.' });
    }
    res.status(201).json(await createIngredient({ ...fields, name: fields.name }));
});

// body: any of name, description, paper_url, recommended_dosage, maximum_dosage, image_url, verified
router.patch('/ingredients/:id', async (req, res) => {
    const patch = pickFields<AdminIngredientPatch>(req.body, INGREDIENT_PATCH_FIELDS);
    const ingredient = await updateIngredient(req.params.id, patch);
    if (!ingredient) { return notFound(res, 'Ingredient'); }
    res.json(ingredient);
});

// body: { password } - the admin's own password, to confirm. Removes the ingredient from every product that lists it.
router.delete('/ingredients/:id', async (req, res) => {
    await requirePasswordConfirmation(req);
    const deleted = await deleteIngredient(req.params.id);
    if (!deleted) { return notFound(res, 'Ingredient'); }
    res.json({ message: 'Ingredient deleted.' });
});

// ------------------------------------------------------------------
// Errors
// ------------------------------------------------------------------

// Express 5 forwards rejected promises from async handlers here, so handlers can just throw.
router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ message: err.message });
    }
    // Postgres: malformed id (e.g. not a uuid)
    if (err?.code === '22P02') {
        return res.status(400).json({ message: 'Invalid id.' });
    }
    // Postgres: unique constraint violation
    if (err?.code === '23505') {
        return res.status(409).json({ message: 'That value is already in use.' });
    }
    console.error('Admin route error:', err);
    res.status(500).json({ message: 'Internal server error.' });
});

export default router;