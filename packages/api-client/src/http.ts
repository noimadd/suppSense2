// to be used before all api calls, prevents repetition 
// to use this copy the below
// export async function functionName(): Promise<ReturnType> {
//   return apiFetch<ReturnType>('/api/endpoint', { method: 'GET' });
// }

import { getApiBaseUrl, authHeader } from './config';

/**
 * Thrown by apiFetch when the server responds with a non-2xx status.
 * message is the server's { message } when it sent one (e.g. "That username is already taken."),
 * so it can be shown to the user directly.
 */
export class ApiError extends Error {
    constructor(public status: number, message: string, public path: string) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = { ...(await authHeader()), ...(options.headers ?? {}) };
    const res = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });

    if (!res.ok)
    {
        let message = `Request to ${path} failed: ${res.status}`;
        try
        {
            const body = await res.json();
            if (typeof body?.message === 'string') { message = body.message; }
        }
        catch { /* body wasn't JSON, keep the generic message */ }

        throw new ApiError(res.status, message, path);
    }
    return res.json();
}

/**
 * Like apiFetch but sends a JSON body
 */
export function apiFetchJson<T>(path: string, method: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

export type APIResponseWrap<T> = {
    result: T | string;
    success: boolean;
    status: number;
}

/**
 * Doesn't throw. Resolves with the result and status, or null if the request couldn't be made at all.
 */
export async function apiFetchWrapped<T>(path: string, options: RequestInit = {}): Promise<APIResponseWrap<T> | null>
{
    const headers = { ...(await authHeader()), ...(options.headers ?? {}) };
    
    try
    {
        const res = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });
        if(!res.ok)
        {
            const decode_text = await res.text();
            return {result: decode_text, success: false, status: res.status, } 
        }
        
        const decode_res = await res.json();
        return {result: decode_res, success: true, status: res.status, }; 
    }
    catch(err)
    {
        console.log(err);
        return null;
    }
}
