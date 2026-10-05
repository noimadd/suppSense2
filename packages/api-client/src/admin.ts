// client functions for the /api/admin routes (see apps/backend/docs/admin.md)
// all of these throw an ApiError on failure, whose message is the server's error message

import {
    Paginated, AdminListQuery, MessageResponse,
    DashboardStats, DailyActivity,
    AdminUser, AdminUserPatch,
    AdminProduct, AdminProductPatch,
    AdminIngredient, AdminIngredientPatch, AdminIngredientCreate, AdminIngredientListQuery,
} from '@suppsense/shared-types';
import { apiFetch, apiFetchJson } from './http';

const ADMIN = '/api/admin';

/**
 * builds "?search=x&limit=50" from a query object, skipping empty values
 */
function queryString(query: object = {}): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '') { continue; }
        params.append(key, String(value));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

const id = (value: string) => encodeURIComponent(value);

// ----------------------- dashboard -----------------------

/**
 * gets the counts for the dashboard stat cards
 */
export function getAdminStats(): Promise<DashboardStats> {
    return apiFetch<DashboardStats>(`${ADMIN}/stats`, { method: 'GET' });
}

/**
 * gets per-day new users and submissions for the dashboard charts
 * @param days how many days back, including today (default 7, max 90)
 */
export function getAdminActivity(days?: number): Promise<DailyActivity[]> {
    return apiFetch<DailyActivity[]>(`${ADMIN}/stats/activity${queryString({ days })}`, { method: 'GET' });
}

// ----------------------- users -----------------------

/**
 * lists users, newest first. search matches name, username or email
 */
export function listAdminUsers(query?: AdminListQuery): Promise<Paginated<AdminUser>> {
    return apiFetch<Paginated<AdminUser>>(`${ADMIN}/users${queryString(query)}`, { method: 'GET' });
}

export function getAdminUser(userId: string): Promise<AdminUser> {
    return apiFetch<AdminUser>(`${ADMIN}/users/${id(userId)}`, { method: 'GET' });
}

/**
 * edits a user. Changing user_type or email logs them out everywhere
 */
export function updateAdminUser(userId: string, patch: AdminUserPatch): Promise<AdminUser> {
    return apiFetchJson<AdminUser>(`${ADMIN}/users/${id(userId)}`, 'PATCH', patch);
}

/**
 * emails the user a temporary password and logs them out everywhere
 */
export function resetAdminUserPassword(userId: string): Promise<MessageResponse> {
    return apiFetchJson<MessageResponse>(`${ADMIN}/users/${id(userId)}/reset_password`, 'POST');
}

/**
 * permanently deletes a user
 * @param adminPassword the logged in admin's own password, to confirm
 */
export function deleteAdminUser(userId: string, adminPassword: string): Promise<MessageResponse> {
    return apiFetchJson<MessageResponse>(`${ADMIN}/users/${id(userId)}`, 'DELETE', { password: adminPassword });
}

// ----------------------- supplement admission (pending submissions) -----------------------

/**
 * lists pending submissions, oldest first. search matches name, brand or barcode
 */
export function listSubmissions(query?: AdminListQuery): Promise<Paginated<AdminProduct>> {
    return apiFetch<Paginated<AdminProduct>>(`${ADMIN}/submissions${queryString(query)}`, { method: 'GET' });
}

export function getSubmission(productId: string): Promise<AdminProduct> {
    return apiFetch<AdminProduct>(`${ADMIN}/submissions/${id(productId)}`, { method: 'GET' });
}

export function updateSubmission(productId: string, patch: AdminProductPatch): Promise<AdminProduct> {
    return apiFetchJson<AdminProduct>(`${ADMIN}/submissions/${id(productId)}`, 'PATCH', patch);
}

/**
 * publishes a submission for all users
 * @param edits optional changes to apply before accepting (e.g. the edited admission form)
 */
export function acceptSubmission(productId: string, edits: AdminProductPatch = {}): Promise<AdminProduct> {
    return apiFetchJson<AdminProduct>(`${ADMIN}/submissions/${id(productId)}/accept`, 'POST', edits);
}

/**
 * discards a submission
 */
export function rejectSubmission(productId: string): Promise<MessageResponse> {
    return apiFetchJson<MessageResponse>(`${ADMIN}/submissions/${id(productId)}/reject`, 'POST');
}

// ----------------------- supplement management (approved products) -----------------------

/**
 * lists approved products, most recently updated first. search matches name, brand or barcode
 */
export function listAdminProducts(query?: AdminListQuery): Promise<Paginated<AdminProduct>> {
    return apiFetch<Paginated<AdminProduct>>(`${ADMIN}/products${queryString(query)}`, { method: 'GET' });
}

export function getAdminProduct(productId: string): Promise<AdminProduct> {
    return apiFetch<AdminProduct>(`${ADMIN}/products/${id(productId)}`, { method: 'GET' });
}

export function updateAdminProduct(productId: string, patch: AdminProductPatch): Promise<AdminProduct> {
    return apiFetchJson<AdminProduct>(`${ADMIN}/products/${id(productId)}`, 'PATCH', patch);
}

/**
 * permanently deletes a product and removes it from every library
 * @param adminPassword the logged in admin's own password, to confirm
 */
export function deleteAdminProduct(productId: string, adminPassword: string): Promise<MessageResponse> {
    return apiFetchJson<MessageResponse>(`${ADMIN}/products/${id(productId)}`, 'DELETE', { password: adminPassword });
}

// ----------------------- ingredient management -----------------------

/**
 * lists ingredients alphabetically. search matches name, verified filters by human verification
 */
export function listAdminIngredients(query?: AdminIngredientListQuery): Promise<Paginated<AdminIngredient>> {
    return apiFetch<Paginated<AdminIngredient>>(`${ADMIN}/ingredients${queryString(query)}`, { method: 'GET' });
}

export function getAdminIngredient(ingredientId: string): Promise<AdminIngredient> {
    return apiFetch<AdminIngredient>(`${ADMIN}/ingredients/${id(ingredientId)}`, { method: 'GET' });
}

export function createAdminIngredient(ingredient: AdminIngredientCreate): Promise<AdminIngredient> {
    return apiFetchJson<AdminIngredient>(`${ADMIN}/ingredients`, 'POST', ingredient);
}

export function updateAdminIngredient(ingredientId: string, patch: AdminIngredientPatch): Promise<AdminIngredient> {
    return apiFetchJson<AdminIngredient>(`${ADMIN}/ingredients/${id(ingredientId)}`, 'PATCH', patch);
}

/**
 * permanently deletes an ingredient, removing it from every product that lists it
 * @param adminPassword the logged in admin's own password, to confirm
 */
export function deleteAdminIngredient(ingredientId: string, adminPassword: string): Promise<MessageResponse> {
    return apiFetchJson<MessageResponse>(`${ADMIN}/ingredients/${id(ingredientId)}`, 'DELETE', { password: adminPassword });
}