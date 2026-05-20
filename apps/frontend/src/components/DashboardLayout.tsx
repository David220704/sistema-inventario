"use client";

/** Sidebar layout for all dashboard pages. Provides collapsible navigation, dark mode toggle, and logout action. */
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

/** Props for DashboardLayout — wraps page content in the sidebar shell. */
interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Productos", icon: Package },
  { href: "/dashboard/stock", label: "Stock", icon: Warehouse },
  { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/alerts", label: "Alertas", icon: Bell },
];

/**
 * Sidebar + header layout. Renders navigation links (Overview, Productos, Stock, Ventas, Alertas),
 * settings link, logout button, collapse toggle, dark mode toggle, and user avatar.
 * Highlights active route based on pathname.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div
      className={`min-h-screen flex ${darkMode ? "bg-[#0f1117]" : "bg-[#faf9f7]"} transition-colors duration-300`}
    >
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full flex flex-col z-20 transition-all duration-300 ${
          darkMode
            ? "bg-[#1a1a2e] border-r border-white/5"
            : "bg-white border-r border-black/5"
        } ${
          collapsed ? "w-[72px] md:w-[72px]" : "w-[240px]"
        } ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div
          className={`h-16 flex items-center justify-between border-b ${darkMode ? "border-white/5" : "border-black/5"} px-4`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-[#0f1117]" />
            </div>
            {!collapsed && (
              <span
                className={`font-semibold text-sm ${darkMode ? "text-white" : "text-[#1a1a2e]"}`}
              >
                Inventario
              </span>
            )}
          </div>
          {/* Close button on mobile */}
          <button
            className="md:hidden p-1 rounded-md hover:bg-white/5"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                    : darkMode
                      ? "text-white/50 hover:text-white hover:bg-white/5"
                      : "text-black/50 hover:text-black hover:bg-black/5"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div
          className={`py-4 px-3 border-t ${darkMode ? "border-white/5" : "border-black/5"} space-y-1`}
        >
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              darkMode
                ? "text-white/50 hover:text-white hover:bg-white/5"
                : "text-black/50 hover:text-black hover:bg-black/5"
            }`}
            onClick={() => setMobileOpen(false)}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Configuración</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              darkMode
                ? "text-white/50 hover:text-red-400 hover:bg-red-500/10"
                : "text-black/50 hover:text-red-600 hover:bg-red-50"
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center transition-all ${
            darkMode
              ? "bg-[#1a1a2e] border border-white/10 text-white/50"
              : "bg-white border border-black/10 text-black/50"
          } hover:scale-110`}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ${collapsed ? "md:ml-[72px]" : "md:ml-[240px]"} ml-0`}
      >
        {/* Header */}
        <header
          className={`h-16 flex items-center justify-between px-4 md:px-8 border-b ${darkMode ? "border-white/5" : "border-black/5"}`}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger - mobile only */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className={`w-5 h-5 ${darkMode ? "text-white" : "text-[#1a1a2e]"}`} />
            </button>
            <h1
              className={`text-lg font-semibold ${darkMode ? "text-white" : "text-[#1a1a2e]"}`}
            >
              {navItems.find((item) => item.href === pathname)?.label ||
                "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                darkMode
                  ? "bg-white/5 border border-white/10 text-white/50 hover:text-white"
                  : "bg-black/5 border border-black/10 text-black/50 hover:text-black"
              }`}
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                darkMode
                  ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                  : "bg-[#f59e0b]/10 text-[#d97706]"
              }`}
            >
              U
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
