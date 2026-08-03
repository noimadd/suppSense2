FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/api-client/package*.json ./packages/api-client/

RUN npm ci

COPY apps/backend ./apps/backend
COPY packages/shared-types ./packages/shared-types
COPY packages/api-client ./packages/api-client

RUN npm run build -w @suppsense/backend

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
USER node
EXPOSE 3000
CMD ["node", "apps/backend/src/server.ts"]