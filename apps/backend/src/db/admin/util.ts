export type { Paginated } from '@suppsense/shared-types/src/admin';

/**
 * Thrown by the admin DB layer when something the route asked for can't be done.
 * The admin router's error handler turns these into JSON responses.
 */
export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

/**
 * Turns a user search string into an ILIKE pattern, escaping the wildcard characters
 * so searching for "100%" doesn't match everything.
 * @returns the pattern, or null if there's nothing to search for (the queries treat null as "match all")
 */
export function likePattern(search?: string | null): string | null {
    const trimmed = search?.trim();
    if (!trimmed) { return null; }
    return `%${trimmed.replace(/[\\%_]/g, (c) => '\\' + c)}%`;
}

/**
 * Builds the SET clause of an UPDATE from a whitelist of columns.
 * Only keys present in `patch` (and not undefined) are included.
 * @param patch the fields to change
 * @param allowed column names that may be changed
 * @param startIndex the first $n placeholder to use
 * @returns the clause ("name = $1, brand = $2") and its values, or null if nothing to update
 */
export function buildSetClause(patch: Record<string, unknown>, allowed: readonly string[], startIndex = 1): { clause: string; values: unknown[] } | null {
    const parts: string[] = [];
    const values: unknown[] = [];

    for (const column of allowed) {
        if (patch[column] === undefined) { continue; }
        values.push(patch[column]);
        parts.push(`${column} = $${startIndex + values.length - 1}`);
    }

    return parts.length ? { clause: parts.join(', '), values } : null;
}