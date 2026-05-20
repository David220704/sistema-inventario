"use client";

/** Sales page — multi-item sale builder with product selector, quantity/price/location inputs, current items table, and recent sales history. */
import React, { useEffect, useMemo, useState } from "react";
import {
  getProducts,
  createSale,
  getSales,
  getTotalStock,
  Product,
  Sale,
} from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Download } from "lucide-react";
import { exportToCsv } from "@/lib/utils";

type CurrentSaleItem = {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  location?: string;
};

/**
 * Sale builder and history. Fetches products and recent sales on mount.
 * Users select a product, set quantity/price/location, add to current items list,
 * then confirm the sale (creates via API). Validates stock with warning.
 * Shows empty state for no items and no history.
 */
const SalesPage: React.FC = () => {
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Current sale builder
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [location, setLocation] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [currentItems, setCurrentItems] = useState<CurrentSaleItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [loadingSales, setLoadingSales] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [salesPage, setSalesPage] = useState<number>(1);
  const [salesPerPage, setSalesPerPage] = useState<number>(10);
  const [salesSortKey, setSalesSortKey] = useState<string>("created_at");
  const [salesSortDir, setSalesSortDir] = useState<"asc" | "desc">("desc");

  // Toast (global via ToastProvider)
  const { addToast } = useToast();

  // Fetch initial data
  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const data = await getProducts();
        if (!cancelled) setProducts(data);
      } catch (e) {
        setError("Error al cargar productos");
        addToast("error", "No se pudieron cargar los productos");
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };
    const fetchSales = async () => {
      setLoadingSales(true);
      try {
        const data = await getSales({ limit: 100 });
        if (!cancelled) {
          setSales(data.sales || []);
        }
      } catch (e) {
        console.error("Error fetching sales:", e);
      } finally {
        if (!cancelled) setLoadingSales(false);
      }
    };
    fetchProducts();
    fetchSales();
    return () => {
      cancelled = true;
    };
  }, []);

  // Update unit price when product changes
  useEffect(() => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (prod) {
      setUnitPrice(prod.price);
    } else {
      setUnitPrice(0);
    }
  }, [selectedProductId, products]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId],
  );

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    if (daysFilter === 0) return sales;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysFilter);
    return sales.filter((s) => new Date(s.created_at) >= cutoff);
  }, [sales, daysFilter]);

  const sortedSales = useMemo(() => {
    const list = [...filteredSales];
    list.sort((a, b) => {
      if (salesSortKey === "created_at") {
        const aVal = new Date(a.created_at).getTime();
        const bVal = new Date(b.created_at).getTime();
        return salesSortDir === "asc" ? aVal - bVal : bVal - aVal;
      } else if (salesSortKey === "total") {
        return salesSortDir === "asc" ? a.total - b.total : b.total - a.total;
      }
      return 0;
    });
    return list;
  }, [filteredSales, salesSortKey, salesSortDir]);

  const salesTotalPages = Math.max(1, Math.ceil(sortedSales.length / salesPerPage));
  useEffect(() => {
    if (salesPage > salesTotalPages) setSalesPage(1);
  }, [salesTotalPages, salesPage]);
  const salesPaginated = sortedSales.slice(
    (salesPage - 1) * salesPerPage,
    salesPage * salesPerPage,
  );

  const toggleSalesSort = (key: string) => {
    if (salesSortKey === key) {
      setSalesSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSalesSortKey(key);
      setSalesSortDir(key === "created_at" ? "desc" : "asc");
    }
  };

  const salesSortArrow = (key: string) =>
    salesSortKey === key ? (salesSortDir === "asc" ? " ▲" : " ▼") : "";

  const exportSalesCsv = () => {
    const headers = ["Fecha", "Total", "Productos"];
    const rows = sortedSales.map((s) => [
      new Date(s.created_at).toLocaleString(),
      s.total.toFixed(2),
      s.items
        .map(
          (it) =>
            `${it.quantity}x ${(it as any).product?.name ?? it.product_id}`,
        )
        .join("; "),
    ]);
    exportToCsv("ventas.csv", headers, rows);
  };

  // Computed totals
  const total = useMemo(
    () => currentItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0),
    [currentItems],
  );

  // Handlers
  const addItem = () => {
    if (!selectedProduct) {
      addToast("error", "Seleccione un producto");
      return;
    }
    if (quantity <= 0) {
      addToast("error", "La cantidad debe ser mayor a 0");
      return;
    }
    // stock check - warn but don't block (backend validates against real Stock records)
    const stockAvailable = selectedProduct ? getTotalStock(selectedProduct) : 0;
    const existing = currentItems.find(
      (i) => i.productId === selectedProduct.id,
    );
    const existingQty = existing?.quantity ?? 0;
    const newTotalQty = existingQty + quantity;
    if (newTotalQty > stockAvailable && stockAvailable > 0) {
      // Just warn, let backend do the real validation
      addToast("warning", `Stock calculado: ${stockAvailable}. El servidor validará el stock real.`);
      // Continue anyway - backend will block if really out of stock
    }
    if (existing) {
      // update existing
      setCurrentItems((items) =>
        items.map((it) =>
          it.productId === selectedProduct.id
            ? { ...it, quantity: it.quantity + quantity }
            : it,
        ),
      );
    } else {
      // add new
      setCurrentItems((items) => [
        ...items,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity,
          unitPrice: unitPrice || selectedProduct.price,
          location: location || undefined,
        },
      ]);
    }
    // reset quantity for next entry
    setQuantity(1);
  };

  const removeItem = (productId: string) => {
    setCurrentItems((items) =>
      items.filter((it) => it.productId !== productId),
    );
  };

  const resetForm = () => {
    setSelectedProductId("");
    setQuantity(1);
    setUnitPrice(0);
    setLocation("");
  };

  const confirmSale = async () => {
    if (currentItems.length === 0) {
      addToast("error", "Agregue al menos un producto a la venta");
      return;
    }
    setCreating(true);
    try {
      const payload = {
        items: currentItems.map((it) => ({
          product_id: it.productId,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          location: it.location,
        })),
      };
      const sale = await createSale(payload);
      addToast("success", `Venta registrada — Total: C$ ${sale.total.toFixed(2)}`);
      // refresh history and reset current sale
      const refreshedSales = await getSales({ limit: 100 });
      setSales(refreshedSales.sales || []);
      setCurrentItems([]);
      resetForm();
      // Optionally refresh products stock
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);
    } catch (e) {
      addToast("error", "No se pudo registrar la venta");
    } finally {
      setCreating(false);
    }
  };

  // Render helpers
  const currentProductStock = selectedProduct
    ? getTotalStock(selectedProduct)
    : 0;

  // UI
  return (
    <main className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold dark:text-white">Ventas</h1>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de venta */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-5">
          <h2 className="text-xl font-semibold mb-3">Registrar venta</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                Producto
              </label>
              <select
                className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:text-white"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">-- Seleccionar producto --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {getTotalStock(p)})
                  </option>
                ))}
              </select>
              {loadingProducts && (
                <div className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                  Cargando productos...
                </div>
              )}
              {selectedProduct && (
                <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  Stock disponible: {getTotalStock(selectedProduct)}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                Cantidad
              </label>
              <input
                type="number"
                min={1}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:text-white"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                Precio unitario
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:text-white"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                Ubicación (opcional)
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-700 dark:text-white"
                placeholder="Ej: Tienda A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={addItem}
              disabled={!selectedProductId}
            >
              Agregar producto
            </button>
            <button
              className="px-3 py-2 bg-gray-200 dark:bg-slate-700 rounded hover:bg-gray-300 dark:hover:bg-slate-600 dark:text-white"
              onClick={resetForm}
              type="button"
            >
              Limpiar
            </button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Items de la venta</h3>
            {currentItems.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No se han agregado productos.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 dark:text-gray-200">
                      Producto
                    </th>
                    <th className="text-left py-1 dark:text-gray-200">
                      Cantidad
                    </th>
                    <th className="text-left py-1 dark:text-gray-200">
                      Precio
                    </th>
                    <th className="text-left py-1 dark:text-gray-200">
                      Subtotal
                    </th>
                    <th className="text-left py-1 dark:text-gray-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((it) => (
                    <tr key={it.productId} className="border-b">
                      <td className="py-1 dark:text-gray-300">
                        {it.productName ?? it.productId}
                      </td>
                      <td className="py-1 dark:text-gray-300">{it.quantity}</td>
                      <td className="py-1 dark:text-gray-300">
                        {it.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-1 dark:text-gray-300">
                        {(it.quantity * it.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-1">
                        <button
                          className="text-sm text-red-600 hover:underline"
                          onClick={() => removeItem(it.productId)}
                          type="button"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-3 flex justify-between items-center">
              <span className="font-semibold dark:text-white">Total</span>
              <span className="text-xl font-semibold dark:text-white">
                {total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              onClick={confirmSale}
              disabled={currentItems.length === 0 || creating}
            >
              {creating ? "Registrando..." : "Registrar venta"}
            </button>
          </div>
        </div>

        {/* Historial de ventas */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-5 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Ventas recientes</h2>
            <div className="flex items-center gap-2">
              {sales.length > 0 && (
                <button
                  onClick={exportSalesCsv}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                  aria-label="Exportar CSV"
                >
                  <Download size={14} /> CSV
                </button>
              )}
              <select
                value={daysFilter}
                onChange={(e) => {
                  setDaysFilter(Number(e.target.value));
                  setSalesPage(1);
                }}
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:text-white"
                aria-label="Filtrar por período"
              >
                <option value={7}>Últimos 7 días</option>
                <option value={30}>Últimos 30 días</option>
                <option value={90}>Últimos 90 días</option>
                <option value={0}>Todas</option>
              </select>
            </div>
          </div>
          {sortedSales.length === 0 ? (
            <div className="text-sm text-gray-500">
              No hay ventas en este período.
            </div>
          ) : (
            <>
            <div className="flex items-center gap-4 mb-2 px-1 text-sm font-semibold text-gray-600 dark:text-gray-300">
              <span
                className="cursor-pointer select-none hover:text-sky-600 dark:hover:text-sky-400"
                onClick={() => toggleSalesSort("created_at")}
              >
                Fecha{salesSortArrow("created_at")}
              </span>
              <span
                className="cursor-pointer select-none hover:text-sky-600 dark:hover:text-sky-400"
                onClick={() => toggleSalesSort("total")}
              >
                Total{salesSortArrow("total")}
              </span>
            </div>
            <ul className="divide-y">
              {salesPaginated.map((s) => (
                <li key={s.id} className="py-3 last:pb-0 last:pt-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium dark:text-gray-400">
                      {new Date(s.created_at).toLocaleString()}
                    </span>
                    <span className="font-semibold">
                      Total: {s.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {s.items
                      .map(
                        (it) =>
                          `${it.quantity}x ${(it as any).product?.name ?? it.product_id}`,
                      )
                      .join(", ")}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center gap-2 pt-3 border-t border-gray-200 dark:border-slate-700 mt-3">
              <div className="flex items-center gap-2">
                <select
                  value={salesPerPage}
                  onChange={(e) => {
                    setSalesPerPage(Number(e.target.value));
                    setSalesPage(1);
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
                  Página {salesPage} de {salesTotalPages}
                </span>
                <button
                  className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 disabled:opacity-50 text-sm"
                  onClick={() => setSalesPage((p) => Math.max(1, p - 1))}
                  disabled={salesPage <= 1}
                >
                  Anterior
                </button>
                <button
                  className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 disabled:opacity-50 text-sm"
                  onClick={() => setSalesPage((p) => Math.min(salesTotalPages, p + 1))}
                  disabled={salesPage >= salesTotalPages}
                >
                  Siguiente
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      </section>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
    </main>
  );
};

export default SalesPage;
