/**
 * Root Layout
 *
 * Layout principal de la aplicación Next.js.
 * Envuelve toda la app con ThemeProvider para soporte global de dark/light mode.
 *
 * Componentes envueltos:
 * - ThemeProvider: Contexto global de tema
 *
 * metadata: Configuración de SEO para toda la app.
 *
 * @module RootLayout
 */

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Sistema de Inventario",
  description: "Sistema de gestión de inventario con tiempo real",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
