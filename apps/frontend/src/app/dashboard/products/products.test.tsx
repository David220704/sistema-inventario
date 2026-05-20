import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetProducts = vi.fn();
const mockGetCategories = vi.fn();
const mockSeedCategories = vi.fn();

vi.mock("@/lib/api", () => ({
  getProducts: (...args: any[]) => mockGetProducts(...args),
  getCategories: (...args: any[]) => mockGetCategories(...args),
  seedCategories: (...args: any[]) => mockSeedCategories(...args),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ darkMode: false }),
}));

vi.mock("@/components/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

import ProductsPage from "./page";
import userEvent from "@testing-library/user-event";

const mockCat = { id: "cat-1", name: "Electrónicos", slug: "electronicos" };
const mockProducts = [
  { id: "p1", name: "Laptop", sku: "LP001", price: 999.99, category_id: "cat-1", category: mockCat, min_quantity: 3, stocks: [] },
  { id: "p2", name: "Mouse", sku: "MS002", price: 25.0, category_id: "cat-1", category: mockCat, min_quantity: 5, stocks: [] },
];

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue([mockCat]);
    mockGetProducts.mockResolvedValue(mockProducts);
  });

  it("shows loading skeleton initially", () => {
    mockGetProducts.mockImplementationOnce(() => new Promise(() => {}));
    const { container } = render(<ProductsPage />);
    // Skeleton renders empty divs with bg-gray-200 class
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error state when API fails", async () => {
    mockGetProducts.mockRejectedValue(new Error("Fail"));
    render(<ProductsPage />);
    expect(await screen.findByText("Error al cargar productos")).toBeDefined();
    expect(screen.getByText("Reintentar")).toBeDefined();
  });

  it("renders product table with data", async () => {
    render(<ProductsPage />);
    expect(await screen.findByText("Productos")).toBeDefined();
    expect(screen.getByText("Laptop")).toBeDefined();
    expect(screen.getByText("Mouse")).toBeDefined();
  });

  it("shows empty state when no products exist", async () => {
    mockGetProducts.mockResolvedValue([]);
    render(<ProductsPage />);
    expect(await screen.findByText("No hay productos")).toBeDefined();
    expect(screen.getByText("Nuevo Producto")).toBeDefined();
  });

  it("opens create modal on button click", async () => {
    render(<ProductsPage />);
    expect(await screen.findByText("Productos")).toBeDefined();

    const user = userEvent.setup();
    const createBtn = screen.getByLabelText("Nuevo Producto");
    await user.click(createBtn);

    // Modal submit button is unique
    expect(screen.getByText("Crear producto")).toBeDefined();
    expect(screen.getByText("Cancelar")).toBeDefined();
  });
});
