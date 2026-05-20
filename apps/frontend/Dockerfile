# ============================================================
# Frontend Dockerfile — Next.js 14 (App Router)
# Multi-stage: deps → build → runner (standalone)
# ============================================================

# ---------- base ----------
FROM node:18-alpine AS base
RUN npm i -g npm@10
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm ci

# ---------- build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build -w apps/frontend

# ---------- runner ----------
FROM base AS runner
WORKDIR /app

COPY --from=build /app/apps/frontend/.next/standalone ./
COPY --from=build /app/apps/frontend/.next/static ./.next/static
COPY --from=build /app/apps/frontend/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
