"use client";

/** Products CRUD page — searchable, filterable table with create/edit modal, image upload, and pagination. */
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Search, Plus, Edit3, Trash2, X, Package, Download } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/components/Toast";
import { exportToCsv } from "@/lib/utils";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  seedCategories,
  Product,
  Category,
  CreateProductData,
  UpdateProductData,
  uploadImage,
} from "@/lib/api";

/**
 * Full CRUD for products. Fetches products and categories on mount, creates seed categories if none exist.
 * Supports search by name/SKU, category filter, pagination, inline table with edit/delete actions,
 * and a modal form for create/edit with image upload. Loading skeleton, error with retry, and empty states.
 */
export default function ProductsPage() {
  const { darkMode } = useTheme();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  type FormState = {
    name: string;
    category_id: string;
    price: string;
    min_quantity: string;
    imageFile: File | null;
  };
  const [form, setForm] = useState<FormState>({
    name: "",
    category_id: "",
    price: "0",
    min_quantity: "0",
    imageFile: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRefCreate = useRef<HTMLInputElement | null>(null);
  const fileInputRefEdit = useRef<HTMLInputElement | null>(null);

  // Fetch products and categories on mount
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener categorías
      let categoriesData = await getCategories();

      // Si no hay categorías, crear las de prueba
      if (categoriesData.length === 0) {
        console.log("[Products] No hay categorías, creando seed...");
        const seedResult = await seedCategories();
        categoriesData = seedResult.categories;
      }

      // Obtener productos
      const productsData = await getProducts({ limit: 100 });

      setCategories(categoriesData);
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

  // Derived categories
  const categoryOptions = useMemo(() => {
    const opts = [{ id: "", name: "Todos" }];
    categories.forEach((c) => opts.push({ id: c.id, name: c.name }));
    return opts;
  }, [categories]);

  const editingProduct = useMemo(
    () => products.find((p) => p.id === editingId) ?? null,
    [products, editingId],
  );

  // Filter & paginate
  const filtered = useMemo(() => {
    let list = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(query.toLowerCase())),
    );
    if (categoryFilter) {
      list = list.filter((p) => p.category_id === categoryFilter);
    }
    return list;
  }, [products, query, categoryFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (sortKey === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortKey === "sku") {
        aVal = (a.sku ?? "").toLowerCase();
        bVal = (b.sku ?? "").toLowerCase();
      } else if (sortKey === "price") {
        aVal = a.price;
        bVal = b.price;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortArrow = (key: string) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const exportProductsCsv = () => {
    const headers = ["Nombre", "SKU", "Categoría", "Precio"];
    const rows = filtered.map((p) => [
      p.name,
      p.sku ?? "",
      p.category?.name ?? "",
      p.price.toFixed(2),
    ]);
    exportToCsv("productos.csv", headers, rows);
  };

  // Form handlers
  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      category_id: categories[0]?.id || "",
      price: "0",
      min_quantity: "0",
      imageFile: null,
    });
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRefCreate.current) fileInputRefCreate.current.value = "";
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category_id: p.category_id ?? "",
      price: String(p.price),
      min_quantity: String(p.min_quantity ?? 0),
      imageFile: null,
    });
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRefEdit.current) fileInputRefEdit.current.value = "";
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleFormChange = (
    field: "name" | "category_id" | "price" | "min_quantity",
    value: string,
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, imageFile: file }));
    if (file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    // Build payloads
    const basePayload: CreateProductData = {
      name: form.name.trim(),
      category_id: form.category_id,
      price: Number(form.price) || 0,
      min_quantity: Number(form.min_quantity) || 0,
    };

    // If an image was selected, upload it first and attach URL
    let uploadedImagePath: string | undefined = undefined;
    if (form.imageFile) {
      try {
        uploadedImagePath = await uploadImage(form.imageFile);
      } catch (uploadErr) {
        console.error("Error uploading image:", uploadErr);
        setError("Error al subir la imagen del producto");
        return;
      }
    }

    const finalPayload: CreateProductData = { ...basePayload };
    if (uploadedImagePath) {
      finalPayload.image_url = uploadedImagePath;
    }

    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, finalPayload);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? updated : p)),
        );
        addToast("success", "Producto actualizado correctamente");
      } else {
        const created = await createProduct(finalPayload);
        setProducts((prev) => [created, ...prev]);
        addToast("success", "Producto creado correctamente");
      }
      closeModal();
      // Clear image data after successful submit
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
      setForm({ name: "", category_id: "", price: "0", min_quantity: "0", imageFile: null });
      if (fileInputRefEdit.current) fileInputRefEdit.current.value = "";
      if (fileInputRefCreate.current) fileInputRefCreate.current.value = "";
    } catch (err: any) {
      console.error("Error saving product:", err);
      addToast("error", err.response?.data?.message || "Error al guardar el producto");
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget));
      addToast("success", "Producto eliminado correctamente");
    } catch (err: any) {
      console.error("Error deleting product:", err);
      addToast("error", err.response?.data?.message || "Error al eliminar el producto");
    } finally {
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => setDeleteTarget(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#0f0f1a] p-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="h-5 w-44 bg-gray-200 dark:bg-[#2a2b3d] rounded" />
            <div className="h-10 w-44 bg-gray-200 dark:bg-[#2a2b3d] rounded" />
          </div>
          <div className="bg-white dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl p-5 h-52" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#0f0f1a] p-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="bg-white dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl p-5 text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Error al cargar productos
            </div>
            <div className="text-gray-600 dark:text-gray-300 mb-3">{error}</div>
            <button
              className="px-4 py-2 bg-white dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2b3d]"
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

  if (paginated.length === 0) {
    const noProducts = products.length === 0;
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#0f0f1a] p-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Productos
            </h1>
            <button
              className="px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-600 text-white rounded-lg flex items-center gap-2"
              onClick={openCreate}
              aria-label="Nuevo Producto"
            >
              <Plus size={16} /> Nuevo Producto
            </button>
          </div>

          {!noProducts && (
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-[#2a2b3d] rounded-lg flex-1">
                <Search size={16} className="text-gray-700 dark:text-gray-200" />
                <input
                  className="bg-transparent border-none outline-none text-gray-700 dark:text-white flex-1"
                  placeholder="Buscar por nombre o SKU..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-200 dark:border-[#2a2b3d] rounded-lg bg-white dark:bg-[#1e1f2e] text-gray-700 dark:text-white"
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl p-5 text-center">
            {noProducts ? (
              <>
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-[#2a2b3d] flex items-center justify-center">
                    <Package size={28} className="text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  No hay productos
                </div>
                <div className="text-gray-600 dark:text-gray-300 mb-4">
                  Crea tu primer producto para empezar.
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Sin resultados
                </div>
                <div className="text-gray-600 dark:text-gray-300 mb-3">
                  No se encontraron productos con los filtros actuales.
                </div>
                <button
                  className="px-4 py-2 bg-white dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2b3d]"
                  onClick={() => {
                    setQuery("");
                    setCategoryFilter("");
                    setPage(1);
                  }}
                >
                  Restablecer filtros
                </button>
              </>
            )}
          </div>
        </div>

        {modalOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            role="dialog"
            aria-label="Formulario de producto"
            onClick={closeModal}
          >
            <div
              className="bg-white dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl p-5 w-[520px] max-w-[calc(100%-32px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3">
                <strong className="text-gray-900 dark:text-gray-100">
                  {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                </strong>
                <button
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2b3d] text-gray-700 dark:text-gray-200"
                  onClick={closeModal}
                  aria-label="Cerrar modal"
                >
                  <X size={16} />
                </button>
              </div>
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                  Nombre
                  <input
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    required
                    className="p-2 border border-gray-200 dark:border-[#2a2b3d] rounded bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                  Categoría
                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      handleFormChange("category_id", e.target.value)
                    }
                    className="p-2 border border-gray-200 dark:border-[#2a2b3d] rounded bg-white dark:bg-[#1e1f2e] text-gray-900 dark:text-white"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                  Precio
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => handleFormChange("price", e.target.value)}
                    className="p-2 border border-gray-200 dark:border-[#2a2b3d] rounded bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                  Stock Mínimo
                  <input
                    type="number"
                    value={form.min_quantity}
                    onChange={(e) => handleFormChange("min_quantity", e.target.value)}
                    className="p-2 border border-gray-200 dark:border-[#2a2b3d] rounded bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200 col-span-2">
                  Imagen local
                  <input
                    ref={fileInputRefCreate}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="p-2 border border-gray-200 dark:border-[#2a2b3d] rounded bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white"
                  />
                </label>
                {imagePreview && (
                  <div className="col-span-2 mt-1.5">
                    <img
                      src={imagePreview}
                      alt="Vista previa de la imagen"
                      className="max-w-[120px] max-h-[120px] rounded-md"
                    />
                  </div>
                )}

                <div className="col-span-2 flex justify-end gap-2 mt-1.5">
                  <button
                    type="button"
                    className="px-3 py-1.5 border border-gray-200 dark:border-[#2a2b3d] rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2b3d]"
                    onClick={closeModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gradient-to-r from-sky-400 to-blue-600 text-white rounded-lg"
                  >
                    {editingProduct ? "Guardar cambios" : "Crear producto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0f0f1a] p-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Productos
          </h1>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 border border-gray-200 dark:border-[#2a2b3d] rounded-lg bg-white dark:bg-[#1e1f2e] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2b3d] flex items-center gap-2 text-sm"
              onClick={exportProductsCsv}
              aria-label="Exportar CSV"
            >
              <Download size={16} /> Exportar CSV
            </button>
            <button
              className="px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-600 text-white rounded-lg flex items-center gap-2"
              onClick={openCreate}
              aria-label="Nuevo Producto"
            >
              <Plus size={16} /> Nuevo Producto
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-[#2a2b3d] rounded-lg flex-1">
            <Search size={16} className="text-gray-700 dark:text-gray-200" />
            <input
              className="bg-transparent border-none outline-none text-gray-700 dark:text-white flex-1"
              placeholder="Buscar por nombre o SKU..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-200 dark:border-[#2a2b3d] rounded-lg bg-white dark:bg-[#1e1f2e] text-gray-700 dark:text-white"
          >
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl p-5 overflow-x-auto">
          <table
            className="w-full border-collapse"
            role="grid"
            aria-label="Tabla de productos"
          >
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2b3d]">
                <th
                  className="text-left p-3 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer select-none hover:text-sky-600 dark:hover:text-sky-400"
                  onClick={() => toggleSort("name")}
                >
                  Nombre{sortArrow("name")}
                </th>
                <th
                  className="text-left p-3 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer select-none hover:text-sky-600 dark:hover:text-sky-400"
                  onClick={() => toggleSort("sku")}
                >
                  SKU{sortArrow("sku")}
                </th>
                <th className="text-left p-3 font-semibold text-sm text-gray-700 dark:text-gray-200">
                  Categoría
                </th>
                <th
                  className="text-left p-3 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer select-none hover:text-sky-600 dark:hover:text-sky-400"
                  onClick={() => toggleSort("price")}
                >
                  Precio{sortArrow("price")}
                </th>
                <th className="text-left p-3 font-semibold text-sm text-gray-700 dark:text-gray-200">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-200 dark:border-[#2a2b3d] hover:bg-gray-50 dark:hover:bg-[#2a2b3d]"
                >
                  <td className="p-3 text-gray-900 dark:text-gray-200 min-w-[180px]">
                    {p.name}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {p.sku || "-"}
                  </td>
                  <td className="p-3 text-gray-900 dark:text-gray-200">
                    {p.category?.name || "-"}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-gray-200">{`$${p.price.toFixed(2)}`}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2b3d] text-gray-700 dark:text-gray-200"
                        onClick={() => openEdit(p)}
                        aria-label="Editar producto"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                        onClick={() => handleDeleteClick(p.id)}
                        aria-label="Eliminar producto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center gap-2 py-3">
          <div className="flex items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1.5 border border-gray-200 dark:border-[#2a2b3d] rounded-md bg-white dark:bg-[#1e1f2e] text-sm text-gray-700 dark:text-gray-200"
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
              Página {page} de {totalPages}
            </span>
            <button
              className="px-3 py-1.5 border border-gray-200 dark:border-[#2a2b3d] rounded-md bg-white dark:bg-[#1e1f2e] text-gray-700 dark:text-gray-200 disabled:opacity-50 text-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </button>
            <button
              className="px-3 py-1.5 border border-gray-200 dark:border-[#2a2b3d] rounded-md bg-white dark:bg-[#1e1f2e] text-gray-700 dark:text-gray-200 disabled:opacity-50 text-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-label="Formulario de producto"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl p-5 w-[520px] max-w-[calc(100%-32px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <strong className="text-gray-900 dark:text-gray-100">
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </strong>
              <button
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#2a2b3d] text-gray-700 dark:text-gray-200"
                onClick={closeModal}
                aria-label="Cerrar modal"
              >
                <X size={16} />
              </button>
            </div>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                  Nombre
                  <input
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    required
                    className="p-2 border border-gray-200 dark:border-[#2a2b3d] rounded bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                  Categoría
                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      handleFormChange("category_id", e.target.value)
                    }
                    className="p-2 border border-gray-200 dark:border-[#2a2b3d] rounded bg-white dark:bg-[#1e1f2e] text-gray-900 dark:text-white"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                Precio
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => handleFormChange("price", e.target.value)}
                  className="p-2 border border-gray-200 dark:border-[#2a2b3d] rounded bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                Stock Mínimo
                <input
                  type="number"
                  value={form.min_quantity}
                  onChange={(e) => handleFormChange("min_quantity", e.target.value)}
                  className="p-2 border border-gray-200 dark:border-[#2a2b3d] rounded bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200 col-span-2">
                Imagen local
                <input
                  ref={fileInputRefEdit}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="p-2 border border-gray-200 dark:border-[#2a2b3d] rounded bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white"
                />
              </label>
              {imagePreview && (
                <div className="col-span-2 mt-1.5">
                  <img
                    src={imagePreview}
                    alt="Vista previa de la imagen"
                    className="max-w-[120px] max-h-[120px] rounded-md"
                  />
                </div>
              )}

              <div className="col-span-2 flex justify-end gap-2 mt-1.5">
                <button
                  type="button"
                  className="px-3 py-1.5 border border-gray-200 dark:border-[#2a2b3d] rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2b3d]"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gradient-to-r from-sky-400 to-blue-600 text-white rounded-lg"
                >
                  {editingProduct ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-label="Confirmar eliminación"
          onClick={cancelDelete}
        >
          <div
            className="bg-white dark:bg-[#1e1f2e] border border-gray-200 dark:border-[#2a2b3d] rounded-xl p-5 w-[380px] max-w-[calc(100%-32px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <strong className="text-gray-900 dark:text-gray-100 text-lg">
                  Eliminar producto
                </strong>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-200 dark:border-[#2a2b3d] rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2b3d]"
                onClick={cancelDelete}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
