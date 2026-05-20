"use client";

/** Stock management page — CRUD table with product/location/quantity, threshold alerts, and create/edit modal. */
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Edit3, Trash2, AlertTriangle, X, Package, Search } from "lucide-react";
import { useTheme } from "../../../components/ThemeProvider";
import { useToast } from "../../../components/Toast";
import {
  getStocks,
  createStock,
  updateStock,
  deleteStock,
  getProducts,
  Stock,
  Product,
} from "../../../lib/api";

/**
 * Stock CRUD table. Fetches stocks and products on mount. Table shows product name, location, quantity,
 * threshold alert badge (green/red), and edit/delete actions. Modal form for create/edit with product
 * dropdown, quantity, and location. Highlights rows below min_quantity threshold.
 * Shows loading skeleton, error with retry, and handles empty state.
 */
export default function StockPage() {
  const theme = useTheme?.() ?? {};
  const darkMode = theme?.darkMode ?? false;
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [stockSortKey, setStockSortKey] = useState<string>("product");
  const [stockSortDir, setStockSortDir] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({
    product_id: "",
    quantity: "0",
    location: "",
  });

  // Fetch stocks and products
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stocksData, productsData] = await Promise.all([
        getStocks(),
        getProducts({ limit: 100 }),
      ]);
      setStocks(stocksData);
      setProducts(productsData);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get product name by id
  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "Unknown";
  };

  // Form handlers
  const openCreate = () => {
    setEditingId(null);
    setForm({
      product_id: products[0]?.id || "",
      quantity: "0",
      location: "",
    });
    setModalOpen(true);
  };

  const openEdit = (stock: any) => {
    setEditingId(stock.id);
    setForm({
      product_id: stock.product_id || "",
      quantity: String(stock.quantity || 0),
      location: stock.location || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleFormChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id || !form.location) return;

    const baseData: any = {
      quantity: Number(form.quantity) || 0,
      location: form.location,
    };
    const stockData = editingId ? baseData : { ...baseData, product_id: form.product_id };

    try {
      if (editingId) {
        const updated = await updateStock(editingId, stockData);
        setStocks((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s)),
        );
        addToast("success", "Stock actualizado correctamente");
      } else {
        const created = await createStock(stockData);
        setStocks((prev) => [created, ...prev]);
        addToast("success", "Stock creado correctamente");
      }
      closeModal();
    } catch (err: any) {
      console.error("Error saving stock:", err);
      addToast("error", err.response?.data?.message || "Error al guardar el stock");
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStock(deleteTarget);
      setStocks((prev) => prev.filter((s) => s.id !== deleteTarget));
      addToast("success", "Stock eliminado correctamente");
    } catch (err: any) {
      console.error("Error deleting stock:", err);
      addToast("error", err.response?.data?.message || "Error al eliminar el stock");
    } finally {
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => setDeleteTarget(null);

  // Filter stocks by product name or location
  const filteredStocks = useMemo(() => {
    if (!query.trim()) return stocks;
    const q = query.toLowerCase();
    return stocks.filter(
      (s) =>
        getProductName(s.product_id).toLowerCase().includes(q) ||
        (s.location && s.location.toLowerCase().includes(q)),
    );
  }, [stocks, query, products]);

  const sortedStocks = useMemo(() => {
    const list = [...filteredStocks];
    list.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (stockSortKey === "product") {
        aVal = getProductName(a.product_id).toLowerCase();
        bVal = getProductName(b.product_id).toLowerCase();
      } else if (stockSortKey === "location") {
        aVal = (a.location ?? "").toLowerCase();
        bVal = (b.location ?? "").toLowerCase();
      } else if (stockSortKey === "quantity") {
        aVal = a.quantity ?? 0;
        bVal = b.quantity ?? 0;
      }
      if (aVal < bVal) return stockSortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return stockSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredStocks, stockSortKey, stockSortDir]);

  const totalStockPages = Math.max(1, Math.ceil(sortedStocks.length / perPage));
  useEffect(() => {
    if (page > totalStockPages) setPage(1);
  }, [totalStockPages, page]);
  const paginatedStocks = sortedStocks.slice((page - 1) * perPage, page * perPage);

  const toggleStockSort = (key: string) => {
    if (stockSortKey === key) {
      setStockSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setStockSortKey(key);
      setStockSortDir("asc");
    }
  };

  const stockSortArrow = (key: string) =>
    stockSortKey === key ? (stockSortDir === "asc" ? " ▲" : " ▼") : "";

  // Check if stock is below product's min_quantity threshold
  const isBelowThreshold = (product: any, quantity: number) => {
    const threshold = product?.min_quantity ?? 0;
    return threshold > 0 && quantity < threshold;
  };

  // Tailwind-based rendering (no CSS vars). The entire UI uses dark: classes.
  if (loading) {
    return (
      <div
        className={`dashboard min-h-screen bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 ${darkMode ? "dark-mode" : ""}`}
      >
        <div className="container mx-auto max-w-5xl pt-10">
          <div className="header flex justify-between items-center mb-3">
            <div className="title h-5 w-44 rounded-md bg-gray-200 dark:bg-slate-700" />
            <div className="h-10 w-44 rounded-md bg-gray-200 dark:bg-slate-700" />
          </div>
          <div className="card h-52 rounded-lg bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`dashboard min-h-screen bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 ${darkMode ? "dark-mode" : ""}`}
      >
        <div className="container mx-auto max-w-5xl pt-6">
          <div className="empty-state card p-5 text-center rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Error al cargar stock
            </div>
            <div className="mb-3 text-red-600 dark:text-red-400">{error}</div>
            <button
              className="px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/40"
              onClick={() => {
                setError(null);
                fetchData();
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`dashboard min-h-screen bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 ${darkMode ? "dark-mode" : ""}`}
    >
      <div className="container mx-auto max-w-5xl pt-10">
        <div className="header flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Stock
          </h1>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90"
            onClick={openCreate}
            aria-label="Nuevo Stock"
          >
            <Plus size={16} /> Nuevo Stock
          </button>
        </div>

        {/* Search bar */}
        {stocks.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 mb-4">
            <Search size={16} className="text-gray-500 dark:text-gray-400" />
            <input
              className="bg-transparent border-none outline-none text-gray-700 dark:text-white flex-1 text-sm"
              placeholder="Buscar por producto o ubicación..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        )}

        {stocks.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-3">
              <Package size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              No hay registros de stock
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Agrega tu primer registro de stock para empezar.
            </p>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90"
              onClick={openCreate}
            >
              <Plus size={16} /> Nuevo Stock
            </button>
          </div>
        ) : (
        <div className="card overflow-x-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
          <table className="min-w-[600px] w-full table-auto">
            <thead>
              <tr>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 cursor-pointer select-none hover:text-sky-600 dark:hover:text-sky-400"
                  onClick={() => toggleStockSort("product")}
                >
                  Producto{stockSortArrow("product")}
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 cursor-pointer select-none hover:text-sky-600 dark:hover:text-sky-400"
                  onClick={() => toggleStockSort("location")}
                >
                  Ubicación{stockSortArrow("location")}
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 cursor-pointer select-none hover:text-sky-600 dark:hover:text-sky-400"
                  onClick={() => toggleStockSort("quantity")}
                >
                  Cantidad{stockSortArrow("quantity")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Alerta
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {query ? "No se encontraron registros con ese criterio." : "No hay registros de stock."}
                  </td>
                </tr>
              ) : (paginatedStocks.map((s) => (
                <tr
                  key={s.id}
                  className="row hover:bg-gray-100 dark:hover:bg-slate-700/40"
                >
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 name-cell">
                    {getProductName(s.product_id)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 location-cell">
                    {s.location || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 quantity-cell">
                    <span
                      className={
                        isBelowThreshold(s.product, s.quantity)
                          ? "text-red-600 dark:text-red-400 font-semibold"
                          : "text-gray-600 dark:text-gray-300"
                      }
                    >
                      {s.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {s.product?.min_quantity ? (
                      isBelowThreshold(s.product, s.quantity) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-600 text-white text-xs font-semibold">
                          <AlertTriangle size={12} className="mr-1" /> Bajo stock mínimo ({s.product.min_quantity})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
                          Stock mínimo: {s.product.min_quantity}
                        </span>
                      )
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    <button
                      className="inline-flex items-center justify-center p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700/40 mr-1"
                      onClick={() => openEdit(s)}
                      aria-label="Editar stock"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="inline-flex items-center justify-center p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700/40"
                      onClick={() => handleDeleteClick(s.id)}
                      aria-label="Eliminar stock"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        )}

        {(stocks.length > 0 && filteredStocks.length > 0) && (
          <div className="flex justify-between items-center gap-2 py-3">
            <div className="flex items-center gap-2">
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200"
                aria-label="Items por página"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                por página
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Página {page} de {totalStockPages}
              </span>
              <button
                className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 disabled:opacity-50 text-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <button
                className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 disabled:opacity-50 text-sm"
                onClick={() => setPage((p) => Math.min(totalStockPages, p + 1))}
                disabled={page >= totalStockPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4 w-[520px] max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <strong>{editingId ? "Editar Stock" : "Nuevo Stock"}</strong>
              <button
                className="inline-flex items-center justify-center p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700/40"
                onClick={closeModal}
                aria-label="Cerrar modal"
              >
                <X size={16} />
              </button>
            </div>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-1">
                <span>Producto</span>
                <select
                  value={form.product_id}
                  onChange={(e) =>
                    handleFormChange("product_id", e.target.value)
                  }
                  className="p-2 border border-slate-300 rounded bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-100"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span>Cantidad</span>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => handleFormChange("quantity", e.target.value)}
                  className="p-2 border border-slate-300 rounded bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-100"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Ubicación</span>
                <input
                  value={form.location}
                  onChange={(e) => handleFormChange("location", e.target.value)}
                  className="p-2 border border-slate-300 rounded bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-100"
                  required
                  placeholder="Ej: Almacén A"
                />
              </label>
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-slate-300 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-100"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                >
                  {editingId ? "Guardar cambios" : "Crear stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nota: El stock mínimo se configura en Productos → Editar producto → Stock Mínimo */}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-label="Confirmar eliminación"
          onClick={cancelDelete}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-5 w-[380px] max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <strong className="text-gray-900 dark:text-gray-100 text-lg">
                  Eliminar stock
                </strong>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-md border border-slate-300 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-100"
                onClick={cancelDelete}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
