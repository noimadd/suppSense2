# suppSense

A supplement scanning application that allows users to learn about the ingredients within their supplements.

## Stack
 
- **Backend:** Express + TypeScript (`apps/backend`)
- **Databases:** PostgreSQL 16, MongoDB 7, Redis (Redis Stack)
- **Mobile:** Expo / React Native (`apps/mobile`)
- **Desktop:** Electron + React Native Web (`apps/desktop`) — not yet started
- **Shared packages:** TypeScript types and a typed API client, reused across both frontends (`packages/`)
- **Monorepo tooling:** npm workspaces + Turborepo
- **Containerization:** Docker Compose for all backend services

## Project structure
 
```
suppSense/
├── apps/
│   ├── backend/         # Express API
│   ├── mobile/          # Expo app
│   └── desktop/         # Not decided yet
├── packages/
│   ├── shared-types/    # Shared Interfaces
│   ├── api-client/      # Endpoints used by both mobile and desktop
│   ├── ui/              # Shared UI components for consistency
│   └── config/          # Shared configs
├── docker-compose.yml
├── .env
├── .env.example
└── init.sql             # Run on postgres startup
```

## Prerequisites
 
- Node 20+
- Docker
- Expo Go app [SDK-57](https://expo.dev/go)

## How to Run

```bash
git clone https://github.com/noimadd/suppSense2
cd suppSense
npm install 
cp .env.example .env  # make sure you update values
```

### Quick Test

```bash
<local-url>/health // returns {"status":"ok"}
<local-url>/api/supplements // returns [{"id":"1"}]
```

## Running the mobile app
 
```bash
cd apps/mobile
npx expo start
```

Open the expo app and manually enter the address or scan the QR code through the app
