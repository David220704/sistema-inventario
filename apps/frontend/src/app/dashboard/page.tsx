"use client";

/** Main dashboard — fetches metrics, recent products/sales, categories, and low-stock alerts. Displays metric cards, category bar chart, recent products/sales lists, stock alerts, and quick action buttons. */
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  Package,
  Warehouse,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import MetricCard from "@/components/MetricCard";
import RecentProducts from "@/components/RecentProducts";
import RecentSales from "@/components/RecentSales";
import StockAlerts from "@/components/StockAlerts";
import QuickActions from "@/components/QuickActions";
import { getDashboardMetrics, getProducts, getCategories, getSales } from "@/lib/api";
import { getTotalStock } from "@/lib/api";
import type { Product, Sale } from "@/lib/api";
import type { DashboardMetrics } from "@/lib/api";
import type { Category } from "@/lib/api";

/**
 * Dashboard overview. Fetches data from getDashboardMetrics, getProducts, getSales, getCategories via Promise.all.
 * Renders MetricCard grid, stock-by-category progress bars, recent products, recent sales, stock alerts, and quick actions.
 * Shows loading skeleton, error with message, or empty states per section.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { isAuthenticated } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" && localStorage.getItem("token");
    if (!hasToken && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [metricsData, recent, recentSales, cats] = await Promise.all([
        getDashboardMetrics(),
        getProducts({ limit: 20, page: 1 }),
        getSales({ limit: 5 }),
        getCategories(),
      ]);
      setMetrics(metricsData);
      setProducts(recent);
      setSales(recentSales.sales ?? []);
      setCategories(cats);
      setLastUpdated(new Date());
      setError(null);
    } catch (e: any) {
      const backendMessage =
        e?.response?.data?.message ||
        e?.message ||
        "Error cargando el dashboard. Intenta de nuevo.";
      console.error("Dashboard fetch error:", e?.response?.data || e);
      if (!metrics) setError(backendMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  // Auto-refresh every 30 seconds (respects Page Visibility API)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Category stock totals for simple visualization
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    (products ?? []).forEach((p) => {
      const catId = (p as any).category_id || "unknown";
      const s = getTotalStock(p);
      totals[catId] = (totals[catId] ?? 0) + s;
    });
    return totals;
  }, [products]);

  const categoryChart = useMemo(() => {
    const items = categories.map((c) => ({
      categoryId: c.id,
      categoryName: c.name,
      total: categoryTotals[c.id] ?? 0,
    }));
    const maxTotal = items.reduce((m, it) => Math.max(m, it.total), 1);
    return { items, maxTotal };
  }, [categories, categoryTotals]);

  const bgClass = darkMode ? "bg-[#0f0f1a]" : "bg-[#f5f6fa]";
  const cardBg = darkMode ? "bg-[#1e1f2e]" : "bg-white";
  const textPrimary = darkMode ? "text-[#e8e9ed]" : "text-[#1a1a2e]";
  const textSecondary = darkMode ? "text-[#9094a6]" : "text-[#6b7280]";
  const borderClass = darkMode ? "border-[#2a2b3d]" : "border-[#e5e7eb]";
  const accentClass = darkMode ? "text-[#38bdf8]" : "text-[#0284c7]";
  const accentBg = darkMode ? "bg-[#38bdf8]/10" : "bg-[#0284c7]/10";

  if (loading) {
    return (
      <div
        className={`min-h-screen ${bgClass} p-6 transition-colors duration-300`}
      >
        <div className="mb-6">
          <div className="h-7 w-40 bg-gray-200 dark:bg-[#2a2b3d] rounded mb-2 animate-pulse" />
          <div className="h-4 w-56 bg-gray-200 dark:bg-[#2a2b3d] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-gray-200 dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="h-48 bg-gray-200 dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-200 dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-200 dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl animate-pulse" />
        </div>
        <div className="h-48 bg-gray-200 dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen ${bgClass} p-6 transition-colors duration-300`}
      >
        <div
          className={`${cardBg} border ${borderClass} rounded p-4 text-sm text-gray-600 dark:text-gray-300`}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${bgClass} transition-colors duration-300 p-6`}
    >
      {/* Title */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Dashboard</h1>
          <p className={`mt-1 ${textSecondary}`}>Resumen de tu inventario</p>
          {lastUpdated && (
            <p className={`mt-1 text-xs ${textSecondary}`}>
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            darkMode
              ? "bg-[#1e1f2e] border border-[#2a2b3d] text-gray-200 hover:bg-[#2a2b3d]"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          } disabled:opacity-50`}
          aria-label="Refrescar dashboard"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refrescar
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <MetricCard
          title="Total de Productos"
          value={metrics?.totalProducts ?? 0}
          Icon={Package}
        />
        <MetricCard
          title="Categorías"
          value={metrics?.totalCategories ?? 0}
          Icon={Package}
        />
        <MetricCard
          title="Stock Total"
          value={metrics?.totalStock ?? 0}
          Icon={Warehouse}
        />
        <MetricCard
          title="Alertas de Stock"
          value={metrics?.lowStockAlerts?.length ?? 0}
          Icon={Bell}
        />
      </div>

      {/* Sections: Recientes, Stock por Categoría y Alertas de stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <RecentProducts products={products} />
        <div
          className={`bg-white dark:bg-[#1e1f2e] border border-[#e5e7eb] dark:border-[#2a2b3d] rounded-xl p-4`}
        >
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Stock por Categoría
          </h3>
          {categoryChart.items.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Sin datos
            </div>
          ) : (
            <div className="space-y-2">
              {categoryChart.items.map((it) => {
                const percent = Math.min(
                  100,
                  (it.total / categoryChart.maxTotal) * 100,
                );
                return (
                  <div
                    key={it.categoryId}
                    className="flex items-center gap-2"
                    title={it.categoryName}
                  >
                    <span className="text-xs w-28 text-gray-600 dark:text-gray-300 truncate">
                      {it.categoryName}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-2 bg-blue-500"
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-300 w-12 text-right">
                      {it.total}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <StockAlerts alerts={metrics?.lowStockAlerts ?? []} />
      </div>

      {/* Recent Sales */}
      <div className="mb-6">
        <RecentSales sales={sales} />
      </div>

      {/* Quick Actions */}
      <div className={`${cardBg} border ${borderClass} rounded-xl p-5`}>
        <h2 className={`text-base font-semibold ${textPrimary} mb-3`}>
          Acciones Rápidas
        </h2>
        <QuickActions />
      </div>
    </div>
  );
}
