/**
 * Dashboard Root Layout
 *
 * Layout específico para todas las rutas bajo /dashboard.
 * Combina la protección de rutas con el layout del dashboard.
 *
 * Estructura:
 *   ProtectedRoute (verifica JWT)
 *   └── DashboardLayout (sidebar + header)
 *       └── children (páginas del dashboard)
 *
 * Rutas protegidas:
 *   /dashboard
 *   /dashboard/onboarding
 *   /dashboard/stock
 *   /dashboard/products
 *   /dashboard/alerts
 *
 * @module DashboardRootLayout
 */

import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ProtectedRoute verifica JWT y redirige a /login si no está autenticado
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
