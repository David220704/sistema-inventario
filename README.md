# Sistema Inventario

Sistema de gestión de inventario **multi-tenant** construido con **Next.js 14** (App Router) + **NestJS 9** + **Prisma ORM** + **PostgreSQL**, orquestado mediante **Turborepo**.

Una aplicación web moderna para administrar productos, control de stock, ventas, alertas de inventario, métricas y configuración de perfil, con aislamiento completo de datos por inquilino (tenant).

---

## Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Modelo de Datos](#modelo-de-datos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Guía de Inicio Rápido](#guía-de-inicio-rápido)
- [Comandos Disponibles](#comandos-disponibles)
- [API REST](#api-rest)
- [Frontend](#frontend)
- [Testing](#testing)
- [Guías de Desarrollo](#guías-de-desarrollo)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Turborepo                          │
│  ┌─────────────────┐     ┌───────────────────────┐   │
│  │   apps/backend   │     │   apps/frontend       │   │
│  │   NestJS 9 API   │◄───►│   Next.js 14 App      │   │
│  │   Puerto 3001    │     │   Puerto 3000          │   │
│  └────────┬─────────┘     └───────────────────────┘   │
│           │                                            │
│  ┌────────▼─────────┐                                  │
│  │   PostgreSQL DB   │                                  │
│  │   Prisma ORM      │                                  │
│  └──────────────────┘                                  │
└─────────────────────────────────────────────────────┘
```

### Principios de Diseño

| Principio | Implementación |
|-----------|----------------|
| **Multi-tenancy** | Todas las tablas incluyen `tenant_id`; cada query filtra por inquilino vía `@CurrentUser()` |
| **API-first** | Backend NestJS REST con autenticación JWT, validación con class-validator |
| **State management** | Frontend sin estado global — cada página obtiene datos directamente de la API |
| **Monorepo** | Turborepo permite scripts compartidos, dependencias comunes y builds paralelos |
| **Cobertura de tests** | Vitest tanto en backend como frontend, con tests unitarios y de integración |

---

## Stack Tecnológico

### Backend (`apps/backend`)

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | ^9.0 | Framework backend con inyección de dependencias, guards, pipes, filters |
| Prisma | ^5.10 | ORM con type-safety, migrations, seed |
| PostgreSQL | — | Base de datos relacional |
| Passport + JWT | ^10.0 | Autenticación stateless con tokens JWT |
| bcrypt | ^5.1 | Hashing de contraseñas |
| class-validator / class-transformer | — | Validación y transformación de DTOs |
| Vitest | ^4.1 | Testing unitario |

### Frontend (`apps/frontend`)

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 14.2 | React framework con App Router y server components |
| React | ^18.3 | UI components |
| TypeScript | ^5.3 | Tipado estático |
| Tailwind CSS | ^3.4 | Estilos utilitarios |
| Axios | ^1.6 | Cliente HTTP con interceptors para JWT |
| Lucide React | ^0.350 | Iconos SVG |
| clsx + tailwind-merge | — | Utilidades para clases condicionales |
| Vitest + Testing Library | — | Testing de componentes y páginas |

### Infraestructura

- **Node.js** >= 18
- **npm** 10 (workspaces habilitados)
- **Turborepo** ^2.0 — orquestación de builds entre apps

---

## Modelo de Datos

```prisma
model User {
  id                   String   @id @default(uuid())
  email                String   @unique
  password             String   // bcrypt hash
  name                 String
  role                 UserRole // ADMIN | USER
  tenant_id            String
  onboarding_completed Boolean  @default(false)
  onboarding_step      Int      @default(0)
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
}

model Product {
  id            String   @id @default(uuid())
  name          String
  sku           String?  @unique  // Código único por tenant
  description   String?
  image_url     String?
  price         Float
  stockQuantity Int      @default(0)
  min_quantity  Int      @default(0)
  category_id   String
  tenant_id     String
  category      Category @relation  // FK a Category
  alerts        Alert[]
  saleItems     SaleItem[]
}

model Stock {
  id         String   @id @default(uuid())
  product_id String
  quantity   Int
  location   String
  product    Product  @relation
}

model Sale {
  id         String     @id @default(uuid())
  total      Float
  status     SaleStatus @default(COMPLETED) // COMPLETED | CANCELLED
  tenant_id  String
  items      SaleItem[]
}

model SaleItem {
  id         String   @id @default(uuid())
  sale_id    String
  product_id String
  quantity   Int
  unit_price Float
  subtotal   Float
  sale       Sale     @relation
  product    Product  @relation
}

model Category {
  id          String    @id @default(uuid())
  name        String
  description String?
  slug        String?   @unique  // URL-friendly, único por tenant
  tenant_id   String
  products    Product[]
}

model Alert {
  id         String    @id @default(uuid())
  product_id String
  type       AlertType // LOW_STOCK | OUT_OF_STOCK
  message    String
  is_read    Boolean   @default(false)
  tenant_id  String
  product    Product   @relation
}
```

### Diagrama de Relaciones

```
User (1) ──< Product (N) ──< SaleItem (N) ──> Sale (1)
                │                                    │
                │                                    │
                ├──< Stock (N)                       │
                │                                    │
                ├──< Alert (N)                       │
                │                                    │
                >── Category (1)                     │
```

---

## Estructura del Proyecto

```
sistema-inventario/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Modelo de datos
│   │   │   └── seed.ts                # Script de seed (admin por defecto)
│   │   └── src/
│   │       ├── main.ts                 # Entrypoint NestJS
│   │       ├── app.module.ts           # Módulo raíz
│   │       ├── auth/                   # Autenticación JWT
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts  # POST /auth/register, /auth/login
│   │       │   ├── auth.service.ts     # Lógica de registro y login
│   │       │   ├── jwt-auth.guard.ts   # Guard por defecto
│   │       │   ├── strategies/         # Passport strategies
│   │       │   └── dto/                # LoginDto, RegisterDto
│   │       ├── common/                 # Cross-cutting
│   │       │   ├── decorators/         # @CurrentUser(), @Public()
│   │       │   ├── guards/             # JwtAuthGuard global
│   │       │   ├── filters/            # HttpExceptionFilter
│   │       │   └── pipes/              # ValidationPipe personalizado
│   │       ├── database/
│   │       │   ├── prisma.module.ts    # Módulo global de Prisma
│   │       │   └── prisma.service.ts   # Servicio singleton de Prisma
│   │       ├── modules/
│   │       │   ├── products/           # CRUD de productos
│   │       │   ├── stock/              # Control de stock
│   │       │   ├── sales/              # Registro de ventas
│   │       │   ├── categories/         # Categorías de productos
│   │       │   ├── alerts/             # Alertas de inventario
│   │       │   ├── metrics/            # Métricas del dashboard
│   │       │   ├── settings/           # Perfil, contraseña, preferencias
│   │       │   └── uploads/            # Subida de imágenes
│   │       ├── users/                  # Onboarding de usuarios
│   │       └── security/               # Tests de aislamiento multi-tenant
│   │
│   └── frontend/
│       └── src/
│           ├── app/
│           │   ├── layout.tsx          # Layout raíz con ThemeProvider + ToastProvider
│           │   ├── page.tsx            # Redirección a /dashboard
│           │   ├── login/page.tsx      # Inicio de sesión
│           │   ├── register/page.tsx   # Registro de usuarios
│           │   └── dashboard/
│           │       ├── layout.tsx      # Layout del dashboard (sidebar + navbar)
│           │       ├── page.tsx        # Dashboard principal (métricas, alertas, ventas)
│           │       ├── products/page.tsx
│           │       ├── stock/page.tsx
│           │       ├── sales/page.tsx
│           │       ├── alerts/page.tsx
│           │       ├── settings/page.tsx
│           │       └── onboarding/page.tsx
│           ├── components/
│           │   ├── DashboardLayout.tsx  # Sidebar + navbar del dashboard
│           │   ├── ThemeProvider.tsx     # Provider de tema dark/light
│           │   ├── ProtectedRoute.tsx    # Guard de autenticación cliente
│           │   ├── Navbar.tsx            # Barra de navegación superior
│           │   ├── MetricCard.tsx        # Tarjeta de métrica reutilizable
│           │   ├── RecentSales.tsx       # Tabla de ventas recientes
│           │   ├── RecentProducts.tsx    # Lista de productos recientes
│           │   ├── StockAlerts.tsx       # Alertas de stock bajo
│           │   ├── QuickActions.tsx      # Acciones rápidas del dashboard
│           │   ├── OnboardingFlow.tsx    # Flujo de onboarding paso a paso
│           │   └── Toast.tsx             # Sistema de notificaciones toast
│           ├── hooks/
│           │   ├── useAuth.ts            # Hook de autenticación (login, logout, register)
│           │   └── useToggle.ts          # Hook genérico de toggle booleano
│           └── lib/
│               ├── api.ts               # Axios instance con interceptor JWT
│               ├── utils.ts             # Utilidades (cn, formatDate, formatCurrency)
│               ├── db.ts                # Cliente directo a base de datos (server)
│               └── prisma.ts            # Singleton Prisma client (server)
│
├── turbo.json                    # Configuración de Turborepo
├── tsconfig.base.json            # TypeScript base config compartido
├── .env.example                  # Variables de entorno de ejemplo
├── AGENTS.md                     # Documentación de arquitectura para agentes AI
└── package.json                  # Workspace root
```

---

## Guía de Inicio Rápido

### Prerrequisitos

- Node.js >= 18
- PostgreSQL (local o Docker)
- npm >= 10

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url> sistema-inventario
cd sistema-inventario
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example apps/backend/.env
```

Edita `apps/backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventario"
JWT_SECRET="genera-un-secreto-seguro-aqui"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### 3. Configurar base de datos

```bash
# Ejecutar migrations
npm run db:migrate

# (Opcional) Poblar con datos de prueba
npm run db:seed
```

### 4. Iniciar desarrollo

```bash
# Inicia backend (puerto 3001) y frontend (puerto 3000) simultáneamente
npm run dev
```

### 5. Abrir en el navegador

```
Frontend: http://localhost:3000
Backend:  http://localhost:3001
```

---

## Comandos Disponibles

### Root (Turborepo)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia apps en modo desarrollo (paralelo) |
| `npm run build` | Build de producción completo |
| `npm run lint` | ESLint en todas las apps |
| `npm run typecheck` | TypeScript check global |
| `npm run format` | Prettier en todos los archivos |
| `npm run db:migrate` | Ejecuta `prisma migrate dev` en backend |
| `npm run db:generate` | Regenera Prisma Client |
| `npm run db:seed` | Ejecuta seed script |
| `npm run db:studio` | Abre Prisma Studio (GUI de datos) |

### Backend (`apps/backend`)

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | Inicia servidor con hot-reload (ts-node) |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm run test:run` | Ejecuta todos los tests una vez |
| `npm run test` | Ejecuta tests en modo watch |
| `npm run test:coverage` | Tests con reporte de cobertura |

### Frontend (`apps/frontend`)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo (puerto 3000) |
| `npm run build` | Build de producción (Next.js) |
| `npm run test:run` | Ejecuta todos los tests una vez |
| `npm run test` | Ejecuta tests en modo watch |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run lint` | Linter específico de Next.js |

---

## API REST

### Autenticación

Todas las rutas protegidas requieren el header:

```
Authorization: Bearer <jwt_token>
```

El token JWT incluye `userId`, `email`, `role` y `tenant_id`. Se obtiene al registrar o iniciar sesión.

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/auth/register` | Público | Registra un nuevo usuario |
| `POST` | `/auth/login` | Público | Inicia sesión, devuelve JWT |

### Productos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/products` | Lista productos (filtrables por query params) |
| `GET` | `/products/:id` | Obtener producto por ID |
| `POST` | `/products` | Crear producto |
| `PATCH` | `/products/:id` | Actualizar producto |
| `DELETE` | `/products/:id` | Eliminar producto |

### Stock

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/stock` | Lista registros de stock |
| `GET` | `/stock/:id` | Obtener registro de stock |
| `POST` | `/stock` | Crear registro de stock |
| `PATCH` | `/stock/:id` | Actualizar stock |
| `DELETE` | `/stock/:id` | Eliminar registro |

### Ventas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/sales` | Lista ventas |
| `GET` | `/sales/:id` | Obtener venta con items |
| `POST` | `/sales` | Crear venta (con items) |
| `PATCH` | `/sales/:id` | Actualizar venta |
| `DELETE` | `/sales/:id` | Cancelar venta |

### Categorías

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/categories` | Lista categorías |
| `GET` | `/categories/:id` | Obtener categoría |
| `POST` | `/categories` | Crear categoría |
| `PATCH` | `/categories/:id` | Actualizar categoría |
| `DELETE` | `/categories/:id` | Eliminar categoría |

### Alertas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/alerts` | Lista alertas (filtrables por tipo) |
| `POST` | `/alerts/:id/read` | Marcar alerta como leída |

### Métricas (Dashboard)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/metrics` | Obtener métricas del dashboard (productos totales, stock bajo, ventas del día, etc.) |

### Settings

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/settings/profile` | Obtener perfil del usuario |
| `PATCH` | `/settings/profile` | Actualizar perfil |
| `POST` | `/settings/change-password` | Cambiar contraseña |
| `DELETE` | `/settings/account` | Eliminar cuenta |

### Users (Onboarding)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/users/onboarding` | Obtener estado del onboarding |
| `PATCH` | `/users/onboarding-step` | Actualizar paso actual |
| `POST` | `/users/complete-onboarding` | Marcar onboarding como completado |

---

## Frontend

### Temas (Dark/Light Mode)

El proyecto incluye un sistema de tema completo con persistencia en `localStorage`:

```typescript
import { useTheme } from '@/components/ThemeProvider';

function Component() {
  const { darkMode, toggleDarkMode, theme } = useTheme();
  return <div className={theme}>Contenido</div>;
}
```

### Autenticación (Cliente)

```typescript
import { useAuth } from '@/hooks/useAuth';

function Component() {
  const { isAuthenticated, user, login, logout, loading } = useAuth();
  // user: { id, email, name, role, tenant_id }
}
```

### API Client

```typescript
import api from '@/lib/api';

// El interceptor attacha automáticamente el token JWT desde localStorage
const { data } = await api.get('/products');
const { data } = await api.post('/products', { name, price, ... });
```

### Routing

- `/login` — Inicio de sesión
- `/register` — Registro de nuevo usuario
- `/dashboard` — Dashboard principal (protegido)
- `/dashboard/products` — Gestión de productos
- `/dashboard/stock` — Control de inventario
- `/dashboard/sales` — Registro de ventas
- `/dashboard/alerts` — Alertas de inventario
- `/dashboard/settings` — Configuración de perfil
- `/dashboard/onboarding` — Flujo de onboarding post-registro

### Componentes Clave

| Componente | Descripción |
|------------|-------------|
| `ProtectedRoute` | Redirige a `/login` si el usuario no está autenticado |
| `ThemeProvider` | Provee contexto de tema (dark/light) a toda la app |
| `ToastProvider` / `useToast` | Sistema de notificaciones toast |
| `OnboardingFlow` | Guía de inicio para nuevos usuarios (persistente vía API) |
| `DashboardLayout` | Layout principal con sidebar navegable |
| `MetricCard` | Tarjeta reutilizable para mostrar métricas |
| `RecentSales` | Tabla de últimas ventas con formato de moneda |
| `StockAlerts` | Alertas visuales de stock bajo |
| `QuickActions` | Botones de acceso rápido a funcionalidades clave |

---

## Testing

### Stack de Testing

- **Framework**: Vitest (tanto backend como frontend)
- **Frontend**: Testing Library (`@testing-library/react`, `@testing-library/user-event`, `jsdom`)
- **Backend**: `@nestjs/testing` con módulos mockeados

### Ejecutar Tests

```bash
# Todos los tests (ambas apps)
cd apps/backend && npm run test:run
cd apps/frontend && npm run test:run

# Test específico (backend)
npx vitest run src/modules/products/products.service.test.ts

# Tests en modo watch
npm run test

# Cobertura
npm run test:coverage
```

### Cobertura Actual

| Área | Suites | Tests |
|------|--------|-------|
| Backend (NestJS) | 14 | 137 |
| Frontend (Next.js) | 12 | 103 |
| **Total** | **26** | **240** |

*240 tests — todos pasando.*

### Convenciones de Testing

- **Backend**: Tests unitarios por servicio + controller. Los módulos se testean con `@nestjs/testing` y mockeando `PrismaService`.
- **Frontend**: Tests de componentes (renderizado, interacciones, estados vacío/error/loading) y tests de páginas (integración con API mockeada).
- **Archivos**: `*.test.ts` (backend), `*.test.tsx` (frontend), colocalizados junto al archivo fuente.

---

## Guías de Desarrollo

### Convenciones de Código

**Backend (NestJS)**:

- Archivos en **kebab-case** (`products.service.ts`)
- DTOs con decoradores `class-validator`
- `@CurrentUser()` decorator para extraer usuario del JWT
- `JwtAuthGuard` en todas las rutas protegidas
- Transacciones Prisma `$transaction` para operaciones multi-paso
- Filtro `tenant_id` obligatorio en todas las queries

**Frontend (Next.js)**:

- Archivos en **PascalCase** (`ProductsPage.tsx`)
- Directiva `"use client"` requerida para componentes con hooks
- Uso obligatorio de `useTheme()` para modo dark/light
- Cliente API via axios instance (`@/lib/api`)
- Sin estado global — cada página obtiene sus datos directamente

### Multi-Tenancy (CRÍTICO)

Todas las queries a base de datos deben filtrar por `tenant_id`:

```typescript
// Correcto
const products = await prisma.product.findMany({
  where: { tenant_id: user.tenant_id }
});

// Incorrecto — expone datos de otros inquilinos
const products = await prisma.product.findMany();
```

El decorador `@CurrentUser()` provee el usuario autenticado incluyendo su `tenant_id`.

### Flujo de Autenticación

```
Registro → Login → JWT Token → Frontend almacena en localStorage →
  Cada request incluye Authorization: Bearer <token> →
    Backend valida con JwtAuthGuard → 
      @CurrentUser() extrae payload → tenant_id disponible en handlers
```

### Variables de Entorno

```env
# Backend (.env en apps/backend/)
DATABASE_URL="postgresql://user:pass@localhost:5432/inventario"
JWT_SECRET="secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Frontend (.env.local en apps/frontend/)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Seed

El seed script (`apps/backend/prisma/seed.ts`) es idempotente — crea un usuario administrador por defecto si no existe e inserta datos de prueba realistas:

```bash
npm run db:seed
```

**Por defecto**: Crea admin con email `admin@test.com` / contraseña `Admin123!` (solo en desarrollo).

**Datos de prueba**: 25 productos en 6 categorías (electrónicos, hogar, oficina, ropa, alimentos, ferretería, salud/belleza), 30+ registros de stock en ubicaciones variadas, 60+ ventas históricas, y alertas de stock bajo generadas automáticamente para productos con inventario crítico.

---

## Buenas Prácticas de Desarrollo

1. **Commits atómicos**: Un cambio por commit, mensajes descriptivos en español o inglés
2. **Tests primero**: Para bugs o features nuevas, escribir el test antes de la implementación
3. **Sin type suppression**: Prohibido `as any`, `@ts-ignore` o `@ts-expect-error`
4. **Error handling**: Nunca dejar bloques `catch` vacíos
5. **Código limpio**: Usar `npm run lint` y `npm run format` antes de commitear
6. **Documentación**: Mantener JSDoc actualizado en clases, métodos y funciones exportadas

---

## Roadmap

- [x] Autenticación JWT (registro, login)
- [x] CRUD de productos, stock, ventas, categorías
- [x] Alertas de inventario bajo
- [x] Dashboard con métricas
- [x] Onboarding de nuevos usuarios
- [x] Tests completos (240 tests — todos pasando)
- [x] Documentación de código
- [x] Seed mejorado con 25 productos, 6 categorías, stock, ventas y alertas realistas
- [x] Paginación (productos, stock, ventas)
- [x] Ordenamiento por columnas (productos, stock, ventas)
- [x] Diseño responsive / mobile
- [x] Auto-refresh del dashboard (30s + Visibility API)
- [x] Exportación CSV (productos, ventas)
- [x] Badge de stock bajo en dashboard
- [ ] Docker Compose para desarrollo
- [ ] Git + GitHub setup
- [ ] CI/CD pipeline
- [ ] Despliegue a producción

---

## Licencia

Privado — Uso interno.
