/**
 * ProtectedRoute
 *
 * Wrapper de protección de rutas basado en autenticación JWT.
 * Verifica si el usuario tiene un token válido antes de renderizar children.
 * Redirige a /login si no está autenticado.
 *
 * Uso:
 *   <ProtectedRoute>
 *     <DashboardLayout>{children}</DashboardLayout>
 *   </ProtectedRoute>
 *
 * El componente:
 * 1. Usa useAuth() para verificar autenticación
 * 2. Muestra spinner mientras determina el estado (evita flash)
 * 3. Redirige a /login si no está autenticado
 *
 * @module ProtectedRoute
 */

"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";

type ProtectedRouteProps = {
  children: ReactNode;
  /** Ruta de redirect cuando no está autenticado. Default: /login */
  redirectTo?: string;
};

export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const [checking, setChecking] = useState(true);

  // Una vez montado, deja de mostrar loading
  useEffect(() => {
    setChecking(false);
  }, []);

  // Spinner mientras se verifica autenticación
  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center w-full"
        style={{ background: darkMode ? "#0f1117" : "#f7f5f0" }}
      >
        {/* Spinner con color accent #f59e0b */}
        <svg
          className="animate-spin h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            opacity="0.25"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  // Redirige si no está autenticado
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
