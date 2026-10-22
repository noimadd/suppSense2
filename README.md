# suppSense

A supplement scanning application that allows users to learn about the ingredients within their supplements.

## Stack

- **Backend:** Express + TypeScript (`apps/backend`)
- **Databases:** PostgreSQL 16, Redis (Redis Stack)
- **Mobile:** Expo / React Native (`apps/mobile`)
- **Admin dashboard:** React + Vite (`apps/desktop`)
- **AI summaries:** OpenAI API, used by the admin dashboard to draft ingredient summaries
- **Shared packages:** TypeScript types and a typed API client, reused across both frontends (`packages/`)
- **Monorepo tooling:** npm workspaces + Turborepo
- **Containerisation:** Docker Compose for all backend services

## Project structure

```
suppSense/
├── apps/
│   ├── backend/         # Express API
│   ├── mobile/          # Expo app (users)
│   └── desktop/         # Dashboard (admins)
├── packages/
│   ├── shared-types/    # Shared interfaces
│   └── api-client/      # Endpoints used by both mobile and desktop
├── docker-compose.yml
├── .env                 # Backend secrets (not committed)
├── .env.example
└── init.sql             # Run on postgres startup
```

## Prerequisites

- Node 20+
- Docker
- Expo Go app [SDK 57](https://expo.dev/go) on your phone or android emulator
- An OpenAI API key - only needed for AI ingredient summaries

## 1. Install

```bash
git clone https://github.com/noimadd/suppSense2 suppSense
cd suppSense
npm i
```

## 2. Configure environment variables

There are three `.env` files. Each has a matching `.env.example` to copy from.

| File | Used by | Contains |
| --- | --- | --- |
| `.env` (repo root) | Backend, Postgres, Redis (via Docker Compose) | Database credentials, `JWT_SECRET`, SMTP settings, `OPENAI_API_KEY` |
| `apps/mobile/.env` | Expo app | `EXPO_PUBLIC_API_URL` |
| `apps/desktop/.env` | Admin dashboard | `VITE_API_URL` |

```bash
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/desktop/.env.example apps/desktop/.env
```

Then fill in the values:

- **Root `.env`**
  - `JWT_SECRET`: generate one with `openssl rand -hex 32`
  - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: anything
  - `SMTP_SERVER`, `SMTP_USER`, `SMTP_PASS`: the mail account used to send sign-up verification codes
  - `OPENAI_API_KEY`: from [platform.openai.com/api-keys](https://platform.openai.com/api-keys). Optionally, set `OPENAI_MODEL` (defaults to `gpt-4o-mini`)
- **`apps/mobile/.env`**: `EXPO_PUBLIC_API_URL` must be your computer's LAN IP, not `localhost` e.g. `http://192.168.1.20:3000` or similarly a tailscale ip e.g. `100.81.151.14:3000`
- **`apps/desktop/.env`**: `VITE_API_URL=http://localhost:3000` if the API runs on the same machine as the dashboard

## 3. Start the backend

```bash
docker compose up -d --build
```

This starts:

| Container | What it is | Port |
| --- | --- | --- |
| `suppsense-api` | Express API | 3000 |
| `suppsense-db` | PostgreSQL 16 (runs `init.sql` on first start) | 5432 |
| `suppsense-redis` | Redis (sessions and email verification) | 6379 |
| `suppsense-pgadmin` | pgAdmin, a web UI for the database | 8080 |

After changing backend code, always rebuild with `--build`. A plain `docker compose restart` or `down`/`up` keeps running the old code.

Useful commands:

```bash
docker logs -f suppsense-api     # API logs only
docker compose down              # stop everything (data is kept)
```

## 4. Run the mobile app

```bash
cd apps/mobile
npm i
npx expo start
```

Open Expo Go on your phone and scan the QR code, or enter the address manually. Your phone must be on the same network as the computer running the API unless you are connected over VPN.

Sign up in the app, then enter the 6-digit code sent to your email, you can also manually add yourself to the database if running locally. Make sure that you set your verification status to true or else you will not be able to access any APIs.

## 5. Run the admin dashboard

```bash
cd apps/desktop
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Only admin accounts can sign in. To make your account an admin account just set the userType to 'admin' in the database via pgadmin.

The dashboard has five pages:

- **Dashboard:** user, product and submission stats
- **User Management:** search users, change roles, reset passwords
- **Supplement Admission:** review products submitted by users, then accept or reject them
- **Supplement Management:** edit or remove published products
- **Ingredient Management:** edit ingredient summaries, dosages and sources, generate a summary with AI, and mark it as human verified

## Database tools

pgAdmin runs at http://localhost:8080. Log in with the pgAdmin credentials from the root `.env`, then connect to the server `suppsense-db` using the Postgres credentials.
