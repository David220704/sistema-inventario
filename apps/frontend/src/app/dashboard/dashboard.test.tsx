import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mocks must be before any imports
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: "user-1" }, token: "tok" }),
}));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ darkMode: false, toggleDarkMode: vi.fn() }),
}));

const mockMetrics = {
  totalProducts: 42,
  totalCategories: 5,
  totalStock: 1200,
  lowStockCount: 3,
  outOfStockCount: 1,
  lowStockAlerts: [
    { productId: "p1", productName: "Prod A", quantity: 2, minQuantity: 10 },
  ],
  recentProducts: [],
  stockByCategory: [],
};

const mockGetDashboardMetrics = vi.fn();
const mockGetProducts = vi.fn();
const mockGetSales = vi.fn();
const mockGetCategories = vi.fn();

vi.mock("@/lib/api", () => ({
  getDashboardMetrics: (...args: any[]) => mockGetDashboardMetrics(...args),
  getProducts: (...args: any[]) => mockGetProducts(...args),
  getSales: (...args: any[]) => mockGetSales(...args),
  getCategories: (...args: any[]) => mockGetCategories(...args),
  getTotalStock: (p: any) =>
    p?.stocks?.reduce((s: number, st: any) => s + st.quantity, 0) ??
    p?.stockQuantity ??
    0,
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDashboardMetrics.mockResolvedValue(mockMetrics);
    mockGetProducts.mockResolvedValue([]);
    mockGetSales.mockResolvedValue({ sales: [], total: 0, page: 1, limit: 5, pages: 0 });
    mockGetCategories.mockResolvedValue([]);
  });

  it("shows loading state initially", () => {
    // Don't resolve any promises yet
    mockGetDashboardMetrics.mockImplementationOnce(() => new Promise(() => {}));
    render(<DashboardPage />);
    // Skeleton: animated pulse divs should be present
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it("shows dashboard title and metrics after loading", async () => {
    render(<DashboardPage />);
    expect(await screen.findByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Resumen de tu inventario")).toBeDefined();
    // Metric cards
    expect(screen.getByText("Total de Productos")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
    expect(screen.getByText("Categorías")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("Stock Total")).toBeDefined();
    expect(screen.getByText("1200")).toBeDefined();
    expect(screen.getByText("Alertas de Stock")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined(); // lowStockAlerts.length
  });

  it("shows error state when API fails", async () => {
    mockGetDashboardMetrics.mockRejectedValue(new Error("Network error"));
    render(<DashboardPage />);
    expect(await screen.findByText("Network error")).toBeDefined();
  });

  it("shows StockAlerts section with alert data", async () => {
    render(<DashboardPage />);
    expect(await screen.findByText("Prod A")).toBeDefined();
  });

  it("shows Acciones Rápidas section", async () => {
    render(<DashboardPage />);
    expect(await screen.findByText("Acciones Rápidas")).toBeDefined();
  });
});
