import { apiFetch } from './http';

export function login(email: string, password: string) {
  return apiFetch<{ token: string }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}