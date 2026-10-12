/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
}

// api-client's config.ts reads process.env for the Expo app. It's guarded at runtime
// (there is no `process` in the browser), this just lets it typecheck here.
declare const process: { env: Record<string, string | undefined> };
