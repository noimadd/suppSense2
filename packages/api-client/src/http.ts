// to be used before all api calls, prevents repetition 
// to use this copy the below
// export async function functionName(): Promise<ReturnType> {
//   return apiFetch<ReturnType>('/api/endpoint', { method: 'GET' });
// }

import { API_BASE_URL, authHeader } from './config';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = { ...(await authHeader()), ...(options.headers ?? {}) };
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    throw new Error(`Request to ${path} failed: ${res.status}`);
  }
  return res.json();
}