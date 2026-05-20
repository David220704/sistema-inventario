"use client";

/** Alerts management page — fetches and filters low-stock and out-of-stock alerts. Enriches alerts with product details, supports mark-as-read, type filtering, and expandable detail panels. */
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Package, CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "../../../components/ThemeProvider";
import { useToast } from "../../../components/Toast";
import {
  getAlerts,
  getProduct,
  markAlertRead,
  generateAlerts,
  getTotalStock,
} from "../../../lib/api";
import type {
  Alert as AlertFromApi,
  Product as ProductFromApi,
} from "../../../lib/api";

type AlertItem = AlertFromApi;

const PER_PAGE = 20;

/**
 * Alerts list page. Fetches alerts via getAlerts, enriches with product data, supports type filtering (ALL/LOW_STOCK/OUT_OF_STOCK).
 * Each alert shows status badge, message, product link, restock link, and expandable detail panel.
 * Auto-generates alerts on initial load if none exist. Shows loading, error with retry, and empty states.
 */
export default function AlertsPage() {
  const theme = (useTheme?.() ?? {}) as any;
  const darkMode: boolean = theme?.darkMode ?? false;
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "LOW_STOCK" | "OUT_OF_STOCK"
  >("ALL");
  const [expanded, setExpanded] = useState<string[]>([]);

  // Removed theme-driven CSS vars in favor of Tailwind's dark mode classes

  // Initial data load happens via fetchAlerts call in the effect below

  const fetchAlerts = async (skipGenerate = false) => {
    setLoading(true);
    setError(null);
    try {
      // On initial load, try to generate missing alerts if none exist
      if (!skipGenerate) {
        try {
          const preview = await getAlerts({ limit: 1 });
          if (!preview.items || preview.items.length === 0) {
            await generateAlerts();
          }
        } catch {
          // Ignore errors on pre-check, main fetch will show any errors
        }
      }

      const data = await getAlerts({
        type: typeFilter === "ALL" ? undefined : (typeFilter as any),
        limit: 100,
      });
      const alertsList = data.items ?? data;
      const enriched = await Promise.all(
        alertsList.map(async (a: any) => {
          if (!a.product && a.product_id) {
            try {
              const p = await getProduct(a.product_id);
              return { ...a, product: p } as AlertFromApi;
            } catch {
              return a;
            }
          }
          return a;
        }),
      );
      enriched.sort(
        (a, b) =>
          new Date(b.created_at as string).getTime() -
          new Date(a.created_at as string).getTime(),
      );
      setAlerts(enriched);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? e?.message ?? "Error al cargar alertas",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const markAsRead = async (id: string) => {
    try {
      await markAlertRead(id);
      setAlerts((list) =>
        list.map((a) => (a.id === id ? { ...a, is_read: true } : a)),
      );
      addToast("success", "Alerta marcada como leída");
    } catch {
      addToast("error", "Error al marcar la alerta como leída");
    }
  };

  // Helper to get product stock
  const stockFor = (p?: ProductFromApi) => {
    if (!p) return 0;
    return getTotalStock(p);
  };

  return (
    <div className="dashboard bg-white dark:bg-slate-800">
      <div className="container pt-10">
        <div className="header flex items-center justify-between">
          <div className="title flex items-center gap-2">
            <AlertTriangle size={20} color={darkMode ? "#e8e9ed" : "#1a1a2e"} />
            <h1 className="text-gray-900 dark:text-white m-0">Alerts</h1>
          </div>
          <div className="toolbar flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded px-2 py-1"
              aria-label="Filtrar por tipo de alerta"
            >
              <option value="ALL">Todos</option>
              <option value="LOW_STOCK">Stock bajo</option>
              <option value="OUT_OF_STOCK">Sin stock</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="card p-5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 mt-3">
            Cargando alertas...
          </div>
        )}

        {error && (
          <div className="empty-state card p-5 rounded-lg text-center mt-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="font-semibold">{error}</div>
            <button
              className="btn bg-blue-600 text-white px-3 py-1 rounded mt-2"
              onClick={() => fetchAlerts(true)}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div className="empty-state card flex flex-col items-center justify-center py-12 mt-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <CheckCircle size={28} className="text-green-500 dark:text-green-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Sin alertas
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Todo en orden — no hay alertas de inventario.
            </p>
          </div>
        )}

        {!loading &&
          alerts.map((a) => {
            const product = a.product;
            const stock = product ? stockFor(product as any) : 0;
            const isExpanded = expanded.includes(a.id);
            const isOut = a.type === "OUT_OF_STOCK";
            const badgeColor = isOut ? "#ef4444" : "#f59e0b";
            return (
              <div
                key={a.id}
                className="card flex p-4 gap-3 items-start mt-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
                style={{
                  borderLeft: `4px solid ${isOut ? "#ef4444" : "#f59e0b"}`,
                }}
              >
                <div
                  className="icon w-12 h-12 flex items-center justify-center rounded-full"
                  style={{
                    background: a.type === "LOW_STOCK" ? "#fef3c7" : "#fee2e2",
                    color: isOut ? "#b91c1c" : "#b45309",
                  }}
                >
                  <AlertTriangle size={22} />
                </div>

                <div style={{ flex: 1 }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-100">
                        {a.type === "LOW_STOCK" ? "Stock bajo" : "Out of stock"}{" "}
                        - {product?.name ?? "Producto"}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          padding: "2px 6px",
                          borderRadius: 9999,
                          background: badgeColor,
                          color: "#111",
                        }}
                      >
                        {a.is_read ? "Leído" : "Nuevo"}
                      </span>
                    </div>

                    <div
                      className="actions"
                      style={{ display: "flex", gap: 8 }}
                    >
                      {!a.is_read && (
                        <button
                          className="btn"
                          onClick={() => markAsRead(a.id)}
                          aria-label="Marcar como leído"
                        >
                          <CheckCircle size={16} /> Leer
                        </button>
                      )}
                      <Link
                        href="/dashboard/products"
                        className="btn"
                        aria-label="Ver producto"
                      >
                        <Package size={16} /> Producto
                      </Link>
                      <Link
                        href={`/dashboard/stock?product_id=${a.product_id}`}
                        className="btn"
                        aria-label="Restock"
                      >
                        <XCircle size={16} /> Restock
                      </Link>
                    </div>
                  </div>
                  {a.message && (
                    <div className="mt-1 text-gray-700 dark:text-gray-100">
                      {a.message}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(a.created_at as string).toLocaleString()}
                    </span>
                    <button
                      className="ghost"
                      onClick={() => toggleExpand(a.id)}
                      aria-label="Ver detalles"
                    >
                      {isExpanded ? "Ocultar detalles" : "Ver detalles"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginTop: 8,
                      }}
                    >
                      <div className="panel card p-3 rounded border border-gray-200 dark:border-slate-700">
                        <div className="font-semibold mb-1 text-gray-700 dark:text-gray-100">
                          Detalles del producto
                        </div>

                        {product ? (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 8,
                            }}
                          >
                            <div>
                              <strong>Nombre:</strong> {product.name}
                            </div>
                            <div>
                              <strong>SKU:</strong> {product.sku ?? "-"}
                            </div>
                            <div>
                              <strong>Precio:</strong> ${product.price}
                            </div>
                            <div>
                              <strong>Stock:</strong> {stock}
                            </div>
                            <div>
                              <strong>Categoría:</strong>{" "}
                              {product.category?.name ?? "-"}
                            </div>
                            <div>
                              <strong>Ubicación:</strong>{" "}
                              {product.stockQuantity ?? "-"}
                            </div>
                          </div>
                        ) : (
                          <div>No hay detalles del producto</div>
                        )}
                      </div>
                      <div className="panel card p-3 rounded border border-gray-200 dark:border-slate-700">
                        <div className="font-semibold mb-1 text-gray-700 dark:text-gray-100">
                          Registro
                        </div>
                        <div>ID: {a.id}</div>
                        <div>Tipo: {a.type}</div>
                        <div>
                          Fecha:{" "}
                          {new Date(a.created_at as string).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
