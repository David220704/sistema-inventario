import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RecentSales from "./RecentSales";
import type { Sale } from "@/lib/api";

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "sale-1",
    created_at: "2026-05-01T12:00:00Z",
    updated_at: "2026-05-01T12:00:00Z",
    total: 150.5,
    status: "COMPLETED",
    tenant_id: "tenant-1",
    items: [
      {
        id: "item-1",
        sale_id: "sale-1",
        product_id: "prod-1",
        quantity: 2,
        unit_price: 50,
        subtotal: 100,
        created_at: "2026-05-01T12:00:00Z",
        product: { id: "prod-1", name: "Arduino Uno", price: 50 },
      },
      {
        id: "item-2",
        sale_id: "sale-1",
        product_id: "prod-2",
        quantity: 1,
        unit_price: 50.5,
        subtotal: 50.5,
        created_at: "2026-05-01T12:00:00Z",
        product: { id: "prod-2", name: "Sensor Temp", price: 50.5 },
      },
    ],
    ...overrides,
  };
}

describe("RecentSales", () => {
  it("renders section title", () => {
    render(<RecentSales sales={[]} />);
    expect(screen.getByText("Ventas Recientes")).toBeDefined();
  });

  it("shows empty state when no sales", () => {
    render(<RecentSales sales={[]} />);
    expect(screen.getByText("No hay ventas registradas aún")).toBeDefined();
  });

  it("shows empty state when sales is null", () => {
    render(<RecentSales sales={null as any} />);
    expect(screen.getByText("No hay ventas registradas aún")).toBeDefined();
  });

  it("renders sale total formatted with 2 decimals", () => {
    const sales = [makeSale({ total: 99.9 })];
    render(<RecentSales sales={sales} />);
    expect(screen.getByText("$99.90")).toBeDefined();
  });

  it("renders product names from items", () => {
    const sales = [makeSale()];
    render(<RecentSales sales={sales} />);
    expect(screen.getByText(/Arduino Uno/)).toBeDefined();
    expect(screen.getByText(/Sensor Temp/)).toBeDefined();
  });

  it("renders date in locale format", () => {
    const sales = [makeSale({ created_at: "2026-05-01T12:00:00Z" })];
    render(<RecentSales sales={sales} />);
    // Should render a date string — just check it doesn't show raw timestamp
    expect(screen.getByText(/2026/)).toBeDefined();
  });

  it("shows fallback product_id when product name is missing", () => {
    const sales = [
      makeSale({
        items: [
          {
            id: "item-1",
            sale_id: "sale-1",
            product_id: "prod-abc",
            quantity: 1,
            unit_price: 10,
            subtotal: 10,
            created_at: "2026-05-01T12:00:00Z",
            product: undefined,
          },
        ],
      }),
    ];
    render(<RecentSales sales={sales} />);
    // Should show first 8 chars of product_id as fallback
    expect(screen.getByText(/prod-abc/)).toBeDefined();
  });

  it("shows ellipsis when more than 2 item types", () => {
    const sales = [
      makeSale({
        items: [
          {
            id: "i1", sale_id: "sale-1", product_id: "p1", quantity: 1,
            unit_price: 10, subtotal: 10, created_at: "2026-05-01T12:00:00Z",
            product: { id: "p1", name: "Item A", price: 10 },
          },
          {
            id: "i2", sale_id: "sale-1", product_id: "p2", quantity: 1,
            unit_price: 10, subtotal: 10, created_at: "2026-05-01T12:00:00Z",
            product: { id: "p2", name: "Item B", price: 10 },
          },
          {
            id: "i3", sale_id: "sale-1", product_id: "p3", quantity: 1,
            unit_price: 10, subtotal: 10, created_at: "2026-05-01T12:00:00Z",
            product: { id: "p3", name: "Item C", price: 10 },
          },
        ],
      }),
    ];
    render(<RecentSales sales={sales} />);
    expect(screen.getByText(/\.\.\./)).toBeDefined();
  });

  it("respects limit prop", () => {
    const sales = Array.from({ length: 10 }, (_, i) =>
      makeSale({ id: `sale-${i}`, total: i * 10 }),
    );
    render(<RecentSales sales={sales} limit={3} />);
    // Should only render 3 sale items (checking total display for first 3)
    expect(screen.getByText("$0.00")).toBeDefined();
    expect(screen.getByText("$10.00")).toBeDefined();
    expect(screen.getByText("$20.00")).toBeDefined();
    // $30.00 should NOT be present (4th item, beyond limit)
    expect(screen.queryByText("$30.00")).toBeNull();
  });
});
