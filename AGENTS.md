# Sistema Inventario — AGENTS.md

Single-tenant inventory system. Stack: **Next.js 14** (App Router) + **NestJS 9** + **Prisma** + **Turbo**.

---

## Build Commands

### Root (turbo monorepo)

```bash
npm install            # Install all workspaces
npm run dev           # Start all apps (turbo dev)
npm run build         # Production build all apps
npm run lint          # ESLint all apps
npm run typecheck     # TypeScript check all
```

### Backend (`apps/backend`)

```bash
npm run build         # tsc -p tsconfig.build.json
npm run start:dev     # ts-node -r tsconfig-paths/register src/main.ts
npm run test:run      # vitest run (NOT jest)
npm run db:generate   # prisma generate
npm run db:migrate    # prisma migrate dev
```

**Single test file:**

```bash
npx vitest run src/modules/products/products.service.test.ts
```

### Frontend (`apps/frontend`)

```bash
npm run dev           # next dev (http://localhost:3000)
npm run build         # next build
npm run test:run      # vitest run
npm run lint          # next lint
```

---

## Architecture Facts

### Backend Entrypoint

- **Entry**: `apps/backend/src/main.ts` → `dist/main.js` (prod)
- **AppModule**: imports ConfigModule (global), PrismaModule (global), AuthModule, UsersModule, domain modules
- **Domain modules**: Products, Stock, Categories, Sales, Metrics, Alerts, Settings
- **Path alias**: `@/*` → `src/*` (tsconfig.json)

### Frontend Entrypoint

- **App Router**: `apps/frontend/src/app/` (Next.js 14)
- **Root layout**: `app/layout.tsx` wraps app with `ThemeProvider` + `ToastProvider`
- **Path alias**: `@/*` → `./src/*` (tsconfig.json)

### Multi-Tenant Pattern (Critical)

All major Prisma models include `tenant_id` field. **Every query must filter by `tenant_id`** from `@CurrentUser()` decorator.

```prisma
model Product {
  id        String   @id @default(cuid())
  tenant_id String
  // ...
  @@unique([sku, tenant_id]) // Unique per tenant
}
```

---

## Code Conventions

### Backend (NestJS)

- **Files**: kebab-case (`products.service.ts`)
- **DTOs**: class-validator decorators with `!` assertion
- **Auth**: `@CurrentUser()` decorator extracts user from JWT payload (includes `tenant_id`)
- **Guard**: `JwtAuthGuard` on all protected routes
- **Transactions**: Use `$transaction` for multi-step operations
- **Imports order**: `@nestjs/*` → externals → internals (`@/database`, `./modules`)

### Frontend (Next.js)

- **Files**: PascalCase (`ProductsPage.tsx`)
- **"use client"**: Required for components using hooks/localStorage
- **Theme (mandatory)**: Use `useTheme()` hook for dark/light mode
  ```typescript
  const { darkMode, toggleDarkMode } = useTheme();
  ```
- **API client**: Use axios instance from `@/lib/api` (auto-attaches JWT from localStorage)
- **Env**: `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`)

---

## Critical Rules

| Rule                | Enforcement                                                |
| ------------------- | ---------------------------------------------------------- |
| No type suppression | No `as any`, `@ts-ignore`                                  |
| No empty catch      | `catch(e) {}` forbidden                                    |
| Filter by tenant_id | All queries must include `tenant_id` from `@CurrentUser()` |
| Use auth guard      | `JwtAuthGuard` on all protected routes                     |

---

## Env Setup

```env
# Backend (.env)
DATABASE_URL="postgresql://user:pass@localhost:5432/inventario"
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="7d"
PORT=3001

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Testing Quirks

- **Backend uses Vitest** (not Jest) - config at `apps/backend/vitest.config.ts`
- **Frontend uses Vitest** - config via vite
- **Seed script**: `prisma/seed.ts` (runs via `npm run db:seed`)
- **No CI configs** found in `.github/workflows/`

---

## Project Structure

```
apps/
├── backend/
│   └── src/
│       ├── modules/       # Domain: products, stock, sales, categories, metrics, alerts, settings
│       ├── auth/          # JWT strategy, guards, decorators
│       ├── users/         # Onboarding flow
│       └── database/      # PrismaModule, PrismaService
│
└── frontend/
    └── src/
        ├── app/           # Next.js App Router (dashboard/, login/, register/)
        ├── components/    # UI: ThemeProvider, Toast, MetricCard, etc.
        ├── hooks/         # useAuth.ts
        └── lib/          # api.ts (axios instance)
```

**Note**: `packages/*` workspace defined in root but currently empty.
