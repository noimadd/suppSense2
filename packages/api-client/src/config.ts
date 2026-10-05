type TokenGetter = () => Promise<string | null>;

export interface ApiClientOptions {
    /** overrides the API url, e.g. import.meta.env.VITE_API_URL in the admin dashboard */
    baseUrl?: string;
}

const DEFAULT_API_URL = 'http://localhost:3000';

/**
 * Expo inlines EXPO_PUBLIC_ variables at build time. In a plain browser bundle (the admin dashboard)
 * `process` doesn't exist, so reading it would throw - fall back to the default instead.
 */
function defaultBaseUrl(): string {
    try {
        return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
    } catch {
        return DEFAULT_API_URL;
    }
}

let getToken: TokenGetter = async () => null;
let baseUrl = defaultBaseUrl();

export function configureApiClient(tokenGetter: TokenGetter, options: ApiClientOptions = {}) {
    getToken = tokenGetter;
    if (options.baseUrl) {
        baseUrl = options.baseUrl.replace(/\/+$/, '');
    }
}

export function getApiBaseUrl(): string {
    return baseUrl;
}

export async function authHeader(): Promise<Record<string, string>> {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}