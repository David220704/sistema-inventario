# ============================================================
# Backend Dockerfile — Single stage (simpler, cache-friendly)
# ============================================================

FROM node:18-alpine

RUN apk add --no-cache curl openssl

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY apps/backend/package.json apps/backend/package.json

# Install ALL dependencies (including dev) regardless of NODE_ENV
RUN NODE_ENV=development npm ci

# Copy full source
COPY . .

# Generate Prisma client and build with alias resolution
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma
RUN cd apps/backend && npx tsc -p tsconfig.build.json && npx tsc-alias -p tsconfig.build.json

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "apps/backend/dist/main.js"]
