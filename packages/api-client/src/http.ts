// to be used before all api calls, prevents repetition 
// to use this copy the below
// export async function functionName(): Promise<ReturnType> {
//   return apiFetch<ReturnType>('/api/endpoint', { method: 'GET' });
// }

import { API_BASE_URL, authHeader } from './config';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = { ...(await authHeader()), ...(options.headers ?? {}) };
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if (!res.ok)
    {
        const err = new Error(`Request to ${path} failed: ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

type APIResponseWrap<T> = {
    result: T;
    success: boolean;
    status: number;
}

export async function apiFetchWrapped<T>(path: string, options: RequestInit = {}): Promise<APIResponseWrap<T | string>>
{
    const headers = { ...(await authHeader()), ...(options.headers ?? {}) };
    
    try
    {
        const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    
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
        return null;
    }
}