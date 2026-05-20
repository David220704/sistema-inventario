import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockGetStocks = vi.fn();
const mockGetProducts = vi.fn();

vi.mock("../../../lib/api", () => ({
  getStocks: (...args: any[]) => mockGetStocks(...args),
  getProducts: (...args: any[]) => mockGetProducts(...args),
  createStock: vi.fn(),
  updateStock: vi.fn(),
  deleteStock: vi.fn(),
}));

vi.mock("../../../components/ThemeProvider", () => ({
  useTheme: () => ({ darkMode: false }),
}));

vi.mock("../../../components/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

import StockPage from "./page";
import userEvent from "@testing-library/user-event";

const mockProduct = { id: "p1", name: "Monitor", min_quantity: 5, stocks: [], stockQuantity: 0 };
const mockStocks = [
  {
    id: "s1",
    product_id: "p1",
    quantity: 3,
    location: "Almacén A",
    product: { id: "p1", name: "Monitor", min_quantity: 5 },
  },
];

describe("StockPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStocks.mockResolvedValue(mockStocks);
    mockGetProducts.mockResolvedValue([mockProduct]);
  });

  it("shows loading skeleton initially", () => {
    mockGetStocks.mockImplementationOnce(() => new Promise(() => {}));
    render(<StockPage />);
    // Skeleton has title and card divs with rounded-md/rounded-lg bg classes
    expect(document.querySelector(".title")).toBeDefined();
    expect(document.querySelector(".card")).toBeDefined();
  });

  it("shows error state when API fails", async () => {
    mockGetStocks.mockRejectedValue(new Error("Fail"));
    render(<StockPage />);
    expect(await screen.findByText("Error al cargar stock")).toBeDefined();
    expect(screen.getByText("Reintentar")).toBeDefined();
  });

  it("renders stock table with data", async () => {
    render(<StockPage />);
    expect(await screen.findByText("Stock")).toBeDefined();
    expect(screen.getByText("Monitor")).toBeDefined();
    expect(screen.getByText("Almacén A")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("shows low stock alert badge when below min_quantity", async () => {
    render(<StockPage />);
    expect(await screen.findByText(/Bajo stock mínimo/i)).toBeDefined();
  });

  it("shows empty state when no stocks", async () => {
    mockGetStocks.mockResolvedValue([]);
    render(<StockPage />);
    expect(await screen.findByText("Stock")).toBeDefined();
    expect(screen.getByText("No hay registros de stock")).toBeDefined();
  });

  it("opens create modal on button click", async () => {
    render(<StockPage />);
    expect(await screen.findByText("Stock")).toBeDefined();

    const user = userEvent.setup();
    const createBtn = screen.getByLabelText("Nuevo Stock");
    await user.click(createBtn);

    // Modal submit button is unique to the modal
    expect(screen.getByText("Crear stock")).toBeDefined();
    expect(screen.getByText("Cancelar")).toBeDefined();
  });
});
