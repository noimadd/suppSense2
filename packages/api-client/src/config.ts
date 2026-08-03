type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function configureApiClient(tokenGetter: TokenGetter) {
    getToken = tokenGetter;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function authHeader(): Promise<Record<string, string>> {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}