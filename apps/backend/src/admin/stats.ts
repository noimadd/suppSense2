import { pool } from '../db/pool';

/**
 * The four stat cards along the top of the admin dashboard
 */
export interface DashboardStats {
    registered_users: number;
    pending_submissions: number;
    products_tracked: number;
    ingredients_tracked: number;
}

/**
 * One day's worth of data for the "New Submissions" and "New Users" charts
 */
export interface DailyActivity {
    day: string; // YYYY-MM-DD
    new_users: number;
    new_submissions: number;
}

/**
 * gets the headline counts for the dashboard stat cards
 * @returns counts of users, pending submissions, approved products and ingredients
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const result = await pool.query<DashboardStats>(`
        SELECT
            (SELECT COUNT(*) FROM users)::int AS registered_users,
            (SELECT COUNT(*) FROM products WHERE status = 'pending')::int AS pending_submissions,
            (SELECT COUNT(*) FROM products WHERE status = 'approved')::int AS products_tracked,
            (SELECT COUNT(*) FROM ingredients)::int AS ingredients_tracked
    `);
    return result.rows[0];
}

/**
 * gets per-day counts of new users and new user submissions for the dashboard charts.
 * Every day in the range is returned, including days with zero activity, so the charts don't have gaps.
 * Submissions count anything a user submitted (pending or since approved); rejected ones are deleted so they drop out.
 * @param days how many days back to go, including today
 */
export async function getDashboardActivity(days: number): Promise<DailyActivity[]> {
    const result = await pool.query<DailyActivity>(`
        WITH days AS (
            SELECT generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, INTERVAL '1 day')::date AS day
        )
        SELECT
            to_char(d.day, 'YYYY-MM-DD') AS day,
            (SELECT COUNT(*) FROM users u WHERE u.created_at::date = d.day)::int AS new_users,
            (SELECT COUNT(*) FROM products p WHERE p.submitted_by IS NOT NULL AND p.date_added::date = d.day)::int AS new_submissions
        FROM days d
        ORDER BY d.day
    `, [days]);
    return result.rows;
}