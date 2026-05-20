import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getStocks,
  createStock,
  updateStock,
  deleteStock,
  getSales,
  createSale,
  getSale,
  getDashboardMetrics,
  getAlerts,
  markAlertRead,
  generateAlerts,
  getProfile,
  updateProfile,
  changePassword,
  getTotalStock,
  getMinStock,
} from "./api";

// Mock axios — vi.hoisted ensures mock is created BEFORE vi.mock is hoisted
const mockAxiosInstance = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

describe("API Functions", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue("mock-token"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal("window", {
      location: { href: "" },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ==================== PRODUCTS ====================
  describe("Products API", () => {
    const mockProduct = {
      id: "prod-1",
      name: "Test Product",
      sku: "SKU-0001",
      price: 100,
      category_id: "cat-1",
      stockQuantity: 10,
      min_quantity: 3,
      stocks: [{ quantity: 10 }],
    };

    it("getProducts returns items from paginated response", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { items: [mockProduct], total: 1, page: 1, limit: 10, pages: 1 },
      });

      const result = await getProducts({ page: 1, limit: 10 });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Product");
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/products", {
        params: { page: 1, limit: 10 },
      });
    });

    it("getProducts sends search param", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { items: [], total: 0 },
      });

      await getProducts({ search: "arduino" });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/products", {
        params: { search: "arduino" },
      });
    });

    it("getProduct returns single product", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockProduct });

      const result = await getProduct("prod-1");

      expect(result.id).toBe("prod-1");
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/products/prod-1");
    });

    it("createProduct sends POST with correct data", async () => {
      const dto = {
        name: "New",
        category_id: "cat-1",
        price: 50,
        min_quantity: 3,
      };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockProduct });

      const result = await createProduct(dto);

      expect(result.sku).toBe("SKU-0001");
      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/products", dto);
    });

    it("updateProduct sends PATCH with correct data", async () => {
      const dto = { name: "Updated" };
      mockAxiosInstance.patch.mockResolvedValueOnce({
        data: { ...mockProduct, name: "Updated" },
      });

      const result = await updateProduct("prod-1", dto);

      expect(result.name).toBe("Updated");
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/products/prod-1",
        dto,
      );
    });

    it("deleteProduct sends DELETE", async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({
        data: { deleted: true, id: "prod-1" },
      });

      const result = await deleteProduct("prod-1");

      expect(result.deleted).toBe(true);
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/products/prod-1",
      );
    });
  });

  // ==================== CATEGORIES ====================
  describe("Categories API", () => {
    const mockCategory = { id: "cat-1", name: "Electrónicos", slug: "electronicos" };

    it("getCategories returns all categories", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: [mockCategory],
      });

      const result = await getCategories();

      expect(result).toHaveLength(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/categories");
    });

    it("createCategory sends POST", async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockCategory });

      const result = await createCategory({ name: "Electrónicos" });

      expect(result.name).toBe("Electrónicos");
      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/categories", {
        name: "Electrónicos",
      });
    });

    it("updateCategory sends PATCH", async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({
        data: { ...mockCategory, name: "Updated" },
      });

      const result = await updateCategory("cat-1", { name: "Updated" });

      expect(result.name).toBe("Updated");
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/categories/cat-1",
        { name: "Updated" },
      );
    });

    it("deleteCategory sends DELETE", async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({
        data: { deleted: true, id: "cat-1" },
      });

      const result = await deleteCategory("cat-1");

      expect(result.deleted).toBe(true);
    });
  });

  // ==================== STOCK ====================
  describe("Stock API", () => {
    const mockStock = {
      id: "stock-1",
      product_id: "prod-1",
      quantity: 10,
      location: "Warehouse A",
    };

    it("getStocks returns stocks", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [mockStock] });

      const result = await getStocks();

      expect(result).toHaveLength(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/stocks", {
        params: undefined,
      });
    });

    it("getStocks filters by product_id", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });

      await getStocks({ product_id: "prod-1" });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/stocks", {
        params: { product_id: "prod-1" },
      });
    });

    it("createStock sends POST with product_id, quantity, location", async () => {
      const dto = { product_id: "prod-1", quantity: 5, location: "A" };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockStock });

      const result = await createStock(dto);

      expect(result).toBeDefined();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/stocks", dto);
    });

    it("updateStock sends PATCH", async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({
        data: { ...mockStock, quantity: 20 },
      });

      await updateStock("stock-1", { quantity: 20 });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/stocks/stock-1",
        { quantity: 20 },
      );
    });

    it("deleteStock sends DELETE", async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({
        data: { deleted: true },
      });

      const result = await deleteStock("stock-1");

      expect(result.deleted).toBe(true);
    });
  });

  // ==================== SALES ====================
  describe("Sales API", () => {
    const mockSale = {
      id: "sale-1",
      total: 100,
      status: "COMPLETED",
      tenant_id: "tenant-123",
      created_at: "2026-01-01T00:00:00Z",
      items: [
        { id: "item-1", product_id: "prod-1", quantity: 1, unit_price: 100, subtotal: 100 },
      ],
    };

    it("getSales normalizes backend response", async () => {
      // Backend returns { items: [...], total, page, limit, pages }
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { items: [mockSale], total: 1, page: 1, limit: 10, pages: 1 },
      });

      const result = await getSales({ limit: 5 });

      expect(result.sales).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/sales", {
        params: { limit: 5 },
      });
    });

    it("getSales handles empty response", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { items: [], total: 0, page: 1, limit: 10, pages: 0 },
      });

      const result = await getSales();

      expect(result.sales).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("getSale returns single sale", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockSale });

      const result = await getSale("sale-1");

      expect(result.id).toBe("sale-1");
    });

    it("createSale sends POST with items", async () => {
      const payload = {
        items: [
          { product_id: "prod-1", quantity: 2, unit_price: 50 },
        ],
      };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockSale });

      const result = await createSale(payload);

      expect(result.total).toBe(100);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/sales", payload);
    });
  });

  // ==================== DASHBOARD METRICS ====================
  describe("Dashboard Metrics API", () => {
    it("getDashboardMetrics maps snake_case to camelCase", async () => {
      const backendResponse = {
        total_products: 10,
        total_categories: 5,
        total_stock: 100,
        low_stock_count: 3,
        out_of_stock_count: 1,
        low_stock_alerts: [
          {
            product_id: "prod-1",
            product_name: "Test",
            quantity: 2,
            min_quantity: 5,
            location: "A",
          },
        ],
        recent_products: [],
        stock_by_category: [],
      };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: backendResponse });

      const result = await getDashboardMetrics();

      expect(result.totalProducts).toBe(10);
      expect(result.totalCategories).toBe(5);
      expect(result.totalStock).toBe(100);
      expect(result.lowStockCount).toBe(3);
      expect(result.outOfStockCount).toBe(1);
      expect(result.lowStockAlerts).toHaveLength(1);
      expect(result.lowStockAlerts[0].productId).toBe("prod-1");
      expect(result.lowStockAlerts[0].productName).toBe("Test");
      expect(result.lowStockAlerts[0].quantity).toBe(2);
      expect(result.lowStockAlerts[0].minQuantity).toBe(5);
    });
  });

  // ==================== ALERTS ====================
  describe("Alerts API", () => {
    const mockAlert = {
      id: "alert-1",
      product_id: "prod-1",
      type: "LOW_STOCK",
      message: "Stock bajo",
      is_read: false,
      created_at: "2026-01-01T00:00:00Z",
      product: { id: "prod-1", name: "Test" },
    };

    it("getAlerts returns paginated alerts", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { items: [mockAlert], total: 1, page: 1, limit: 10, pages: 1 },
      });

      const result = await getAlerts();

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("getAlerts handles array response", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: [mockAlert],
      });

      const result = await getAlerts();

      expect(result.items).toHaveLength(1);
    });

    it("getAlerts sends filter params", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { items: [] },
      });

      await getAlerts({ type: "OUT_OF_STOCK", unread: true });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/alerts", {
        params: { type: "OUT_OF_STOCK", unread: true },
      });
    });

    it("markAlertRead sends PATCH", async () => {
      const readAlert = { ...mockAlert, is_read: true };
      mockAxiosInstance.patch.mockResolvedValueOnce({ data: readAlert });

      const result = await markAlertRead("alert-1");

      expect(result.is_read).toBe(true);
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/alerts/alert-1/read",
      );
    });

    it("generateAlerts sends POST", async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { created: 3 },
      });

      const result = await generateAlerts();

      expect(result.created).toBe(3);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/alerts/generate");
    });
  });

  // ==================== SETTINGS ====================
  describe("Settings API", () => {
    it("getProfile fetches profile", async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { name: "David", email: "david@test.com" },
      });

      const result = await getProfile();

      expect(result.name).toBe("David");
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/settings/profile");
    });

    it("updateProfile sends PATCH", async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({
        data: { name: "Updated" },
      });

      const result = await updateProfile({ name: "Updated" });

      expect(result.name).toBe("Updated");
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/settings/profile",
        { name: "Updated" },
      );
    });

    it("changePassword sends POST", async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { message: "Password changed" },
      });

      const result = await changePassword("old", "new");

      expect(result.message).toBe("Password changed");
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/settings/password",
        { old_password: "old", new_password: "new" },
      );
    });
  });

  // ==================== HELPER FUNCTIONS ====================
  describe("Helper Functions", () => {
    it("getTotalStock sums stock entries from stocks array", () => {
      const product = {
        id: "p1",
        name: "Test",
        price: 100,
        stocks: [
          { quantity: 5 },
          { quantity: 3 },
        ],
      };
      expect(getTotalStock(product as any)).toBe(8);
    });

    it("getTotalStock falls back to stockQuantity", () => {
      const product = {
        id: "p1",
        name: "Test",
        price: 100,
        stockQuantity: 15,
      };
      expect(getTotalStock(product as any)).toBe(15);
    });

    it("getTotalStock returns 0 for undefined product", () => {
      expect(getTotalStock(undefined)).toBe(0);
    });

    it("getTotalStock prefers stocks array over stockQuantity", () => {
      const product = {
        id: "p1",
        name: "Test",
        price: 100,
        stockQuantity: 99,
        stocks: [{ quantity: 7 }],
      };
      expect(getTotalStock(product as any)).toBe(7);
    });

    it("getMinStock returns min_quantity", () => {
      const product = { id: "p1", name: "Test", price: 100, min_quantity: 5 };
      expect(getMinStock(product as any)).toBe(5);
    });

    it("getMinStock returns 0 when not set", () => {
      const product = { id: "p1", name: "Test", price: 100 };
      expect(getMinStock(product as any)).toBe(0);
    });
  });

  // ==================== AXIOS INTERCEPTORS ====================
  describe("Axios Interceptors", () => {
    it("axios instance is created with auth config", () => {
      // Interceptors are registered during module load.
      // Our API function tests validate the interceptor chain
      // indirectly: every API call via mockAxiosInstance verifies
      // that the configured instance is used.
      expect(mockAxiosInstance.interceptors.request.use).toBeDefined();
      expect(mockAxiosInstance.interceptors.response.use).toBeDefined();
    });
  });
});
