/**
 * useAuth Hook
 *
 * Hook de autenticación para el frontend.
 * Lee el JWT del localStorage, lo decodifica y expone el estado de autenticación.
 *
 * Funcionalidades:
 * - Lee token del localStorage (solo en cliente)
 * - Decodifica el payload JWT para obtener userId, email, name
 * - Verifica expiración del token
 * - Limpia tokens expirados automáticamente
 *
 * Uso:
 *   const { isAuthenticated, user, token } = useAuth();
 *
 * @module useAuth
 */

"use client";

import { useEffect, useState } from "react";

/** Forma del usuario extraído del JWT */
export interface User {
  id?: string;
  name?: string;
  email?: string;
}

/** Forma del payload JWT */
type JwtPayload = {
  sub?: string;
  name?: string;
  email?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
};

/**
 * Decodifica el payload de un JWT (sin validar firma).
 * Útil solo para extraer datos del cliente, NO para autenticación real.
 * La validación de firma se hace en el backend con JwtStrategy.
 *
 * @param token - JWT string
 * @returns Payload decodificado o null si falla
 */
function decodePayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    // URL-safe base64 decode
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window !== "undefined" && window.atob
        ? window.atob(payload)
        : null;
    if (!json) return null;

    // Decode UTF-8
    const jsonStr = decodeURIComponent(
      json
        .split("")
        .map((c) => "%" + ("0" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Hook de autenticación.
 *
 * @returns {
 *   isAuthenticated: boolean - true si hay token válido
 *   user: User | null - datos del usuario del payload
 *   token: string | null - token raw
 * }
 *
 * Estado inicial retorna isAuthenticated: false para evitar
 * problemas de SSR y hydration mismatch.
 */
export function useAuth() {
  const [state, setState] = useState<{
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
  } | null>(null);

  useEffect(() => {
    // Solo se ejecuta en cliente
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        setState({ isAuthenticated: false, user: null, token: null });
        return;
      }

      // Verificar expiración
      const payload = decodePayload(token);
      const now = Math.floor(Date.now() / 1000);

      if (payload && typeof payload.exp === "number" && payload.exp < now) {
        // Token expirado - limpiar y marcar como no autenticado
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setState({ isAuthenticated: false, user: null, token: null });
        return;
      }

      // Extraer usuario del payload
      const user: User | null = payload?.sub
        ? {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
          }
        : null;

      setState({ isAuthenticated: true, user, token });
    } catch {
      // Cualquier error = no autenticado
      setState({ isAuthenticated: false, user: null, token: null });
    }
  }, []);

  // Retorna false inicialmente para evitar hydration mismatch
  if (state == null) {
    return { isAuthenticated: false, user: null, token: null } as const;
  }
  return state;
}
