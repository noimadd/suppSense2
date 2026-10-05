# SuppSense Admin Dashboard

React + Vite web dashboard for SuppSense admins (D3 section 2.5.3). Talks to the Express API's `/api/admin` routes through `@suppsense/api-client`.

## Running locally

1. Copy `.env.example` to `.env` and point `VITE_API_URL` at the API (default `http://localhost:3000`).
2. From the repo root: `npm install`, then `npm run dev -w desktop` (or `npx turbo dev --filter=desktop`).
3. Open http://localhost:5173 and sign in with an account whose `user_type` is `admin`.

To make an admin locally: `UPDATE users SET user_type = 'admin' WHERE email = 'you@example.com';` in pgAdmin.

## Layout

- `src/lib/session.ts` - sign in/out, tokens in localStorage, automatic token refresh. Every API call goes through `request()`.
- `src/lib/useLoad.ts` - data loading hook used by every page.
- `src/components/` - sidebar layout, dialogs (incl. password-confirmed deletes), product form, chart, toasts.
- `src/pages/` - one file per sidebar section.

## Deploying

`npm run build -w desktop` outputs static files to `dist/`. The app uses URL routing (`/users`, `/products`...), so the server
hosting it must serve `index.html` for any path it doesn't recognise. `VITE_API_URL` is baked in at build time.
