import { ApiError } from '@suppsense/api-client';

/**
 * Turns anything thrown by an API call into a sentence to show the admin
 */
export function errorMessage(err: unknown): string {
    if (err instanceof ApiError) { return err.message; }
    if (err instanceof TypeError) {
        return 'Could not reach the SuppSense server. Check the API is running and VITE_API_URL points at it.';
    }
    if (err instanceof Error && err.message) { return err.message; }
    return 'Something went wrong. Try again.';
}

const relative = new Intl.RelativeTimeFormat('en-NZ', { numeric: 'auto' });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['week', 7 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60],
];

/**
 * "3 days ago", "last month", "just now"
 */
export function timeAgo(iso: string | null | undefined): string {
    if (!iso) { return 'Never'; }
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) {
            return relative.format(Math.round(seconds / size), unit);
        }
    }
    return 'just now';
}

const fullDate = new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDateTime(iso: string | null | undefined): string {
    return iso ? fullDate.format(new Date(iso)) : '';
}

/**
 * "2026-10-05" -> "5 Oct", read as a local date (not UTC midnight)
 */
export function shortDay(day: string): string {
    const [y, m, d] = day.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}

export function plural(count: number, one: string, many = one + 's'): string {
    return `${count.toLocaleString('en-NZ')} ${count === 1 ? one : many}`;
}

/** " match your search" / " matches your search", or nothing when not searching */
export function searchSuffix(count: number, searching: string): string {
    return searching ? (count === 1 ? ' matches your search' : ' match your search') : '';
}
