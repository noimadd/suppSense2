// shared types for the admin dashboard and its /api/admin routes

// ----------------------- common -----------------------

/**
 * A page of results plus the total number of matching rows
 */
export interface Paginated<T> {
    items: T[];
    total: number;
    limit: number;
    offset: number;
}

/**
 * Query params accepted by every admin list endpoint
 */
export interface AdminListQuery {
    search?: string;
    limit?: number;
    offset?: number;
}

export interface MessageResponse {
    message: string;
}

/**
 * Body for destructive admin actions - the admin's own password
 */
export interface PasswordConfirmation {
    password: string;
}

// ----------------------- dashboard -----------------------

export interface DashboardStats {
    registered_users: number;
    pending_submissions: number;
    products_tracked: number;
    ingredients_tracked: number;
}

export interface DailyActivity {
    day: string; // YYYY-MM-DD
    new_users: number;
    new_submissions: number;
}

// ----------------------- users -----------------------

/**
 * A user as the admin dashboard sees it - never includes the password hash
 */
export interface AdminUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    user_type: 'user' | 'admin';
    email_verified: boolean;
    created_at: string;
    last_login: string | null;
}

export interface AdminUserPatch {
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string;
    user_type?: 'user' | 'admin';
    email_verified?: boolean;
}

// ----------------------- products + submissions -----------------------

export type ProductStatus = 'pending' | 'approved';

/**
 * One of a product's ingredients (ProductIngredients joined with Ingredients)
 */
export interface AdminProductIngredient {
    ingredient_id: string;
    name: string;
    amount: string | null;
    verified: boolean;
}

export interface AdminProduct {
    id: string;
    barcode: string;
    name: string;
    brand: string | null;
    description: string | null;
    status: ProductStatus;
    submitted_by: string | null;
    submitter_username: string | null;
    submitter_email: string | null;
    ingredients: AdminProductIngredient[];
    date_added: string;
    date_updated: string;
}

/**
 * An ingredient line on the admin product form. Give ingredient_id to link an existing ingredient,
 * or a name to reuse one with that name (case-insensitive) or create a new unverified one.
 */
export interface AdminProductIngredientInput {
    ingredient_id?: string;
    name?: string;
    amount?: string | null;
}

/**
 * ingredients, if given, replaces the product's whole ingredient list
 */
export interface AdminProductPatch {
    name?: string;
    brand?: string | null;
    barcode?: string;
    description?: string;
    ingredients?: AdminProductIngredientInput[];
}

// ----------------------- ingredients -----------------------

export interface AdminIngredient {
    id: string;
    name: string;
    description: string | null;
    paper_url: string | null;
    recommended_dosage: string | null;
    maximum_dosage: string | null;
    verified: boolean;
    image_url: string | null;
    date_added: string;
    date_updated: string;
    product_count: number;
}

export interface AdminIngredientPatch {
    name?: string;
    description?: string;
    paper_url?: string;
    recommended_dosage?: string;
    maximum_dosage?: string;
    image_url?: string;
    verified?: boolean;
}

export interface AdminIngredientCreate extends AdminIngredientPatch {
    name: string;
}

export interface AdminIngredientListQuery extends AdminListQuery {
    verified?: boolean;
}