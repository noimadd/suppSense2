import { Supplement } from '@suppsense/shared-types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function getSupplements(): Promise<Supplement[]> {
    const res = await fetch(`${API_BASE_URL}/api/supplements`);
    if (!res.ok) throw new Error('Failed to fetch supplements');
    return res.json();
}