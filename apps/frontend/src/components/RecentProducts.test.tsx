import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RecentProducts from "./RecentProducts";
import type { Product } from "@/lib/api";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    name: "Arduino Uno",
    sku: "SKU-001",
    price: 35.5,
    ...overrides,
  };
}

describe("RecentProducts", () => {
  it("renders section title", () => {
    render(<RecentProducts products={[]} />);
    expect(screen.getByText("Productos Recientes")).toBeDefined();
  });

  it("renders product names and skus", () => {
    const products = [
      makeProduct({ id: "p1", name: "Sensor", sku: "SEN-01" }),
    ];
    render(<RecentProducts products={products} />);
    expect(screen.getByText("Sensor")).toBeDefined();
    expect(screen.getByText("SEN-01")).toBeDefined();
  });

  it("handles null products gracefully", () => {
    render(<RecentProducts products={null as any} />);
    expect(screen.getByText("Productos Recientes")).toBeDefined();
  });

  it("respects limit prop", () => {
    const products = Array.from({ length: 10 }, (_, i) =>
      makeProduct({ id: `p${i}`, name: `Product ${i}`, sku: `SKU-${i}` }),
    );
    render(<RecentProducts products={products} limit={2} />);
    expect(screen.getByText("Product 0")).toBeDefined();
    expect(screen.getByText("Product 1")).toBeDefined();
    expect(screen.queryByText("Product 2")).toBeNull();
  });

  it("renders multiple products", () => {
    const products = [
      makeProduct({ id: "p1", name: "Item A", sku: "A-01" }),
      makeProduct({ id: "p2", name: "Item B", sku: "B-01" }),
    ];
    render(<RecentProducts products={products} />);
    expect(screen.getByText("Item A")).toBeDefined();
    expect(screen.getByText("Item B")).toBeDefined();
  });
});
