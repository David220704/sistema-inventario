# ============================================================
# Backend Dockerfile — NestJS 9 + Prisma + PostgreSQL
# Multi-stage: deps → build → runner
# ============================================================

# ---------- base ----------
FROM node:18-alpine AS base
RUN npm i -g npm@10
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci

# ---------- build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma
RUN npx tsc -p apps/backend/tsconfig.build.json && npx tsc-alias -p apps/backend/tsconfig.build.json

# ---------- runner ----------
FROM base AS runner
RUN apk add --no-cache curl

WORKDIR /app

COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/prisma ./prisma
COPY --from=build /app/apps/backend/package.json ./
COPY --from=build /app/apps/backend/tsconfig.json ./
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/main.js"]
