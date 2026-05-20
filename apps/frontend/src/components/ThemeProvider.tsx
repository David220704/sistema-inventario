/**
 * ThemeProvider
 *
 * Proveedor global de contexto para el tema oscuro/claro de la aplicación.
 * Single source of truth - se envuelve toda la app en layout.tsx.
 *
 * Cómo funciona:
 * 1. Mantiene el estado darkMode en React state
 * 2. Usa useEffect para aplicar la clase 'dark' al <html>
 * 3. Tailwind con darkMode: "class" activa los estilos dark: automáticamente
 *
 * Uso en componentes:
 *   import { useTheme } from "@/components/ThemeProvider";
 *   const { darkMode, toggleDarkMode } = useTheme();
 *
 * @module ThemeProvider
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

/** Forma del contexto de tema */
interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

/** Valor por defecto cuando no hay provider (evita crashes) */
const ThemeContext = createContext<ThemeContextType>({
  darkMode: true,
  toggleDarkMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(true);

  // Aplica la clase 'dark' al <html> cuando cambia el estado
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para acceder al tema desde cualquier componente cliente.
 *
 * @returns { darkMode: boolean, toggleDarkMode: () => void }
 *
 * @example
 * const { darkMode, toggleDarkMode } = useTheme();
 * const bg = darkMode ? "bg-black" : "bg-white";
 */
export function useTheme() {
  return useContext(ThemeContext);
}
