import api from "../lib/api";

// Frontend sales service: creates sales, fetches list and single sale
export type SaleItemInput = {
  productId: string;
  quantity: number;
  price?: number; // unit price on frontend (optional)
};

export type SaleInput = {
  customerId?: string;
  locationId: string;
  items: SaleItemInput[];
  paymentMethod?: string;
};

export type SaleItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Sale = {
  id: string;
  customerId?: string;
  locationId: string;
  totalAmount: number;
  createdAt: string;
  items: SaleItem[];
};

// Helpers: map snake_case (backend) to camelCase (frontend)
const mapItemSnakeToCamel = (it: any): SaleItem => {
  return {
    productId: it.product_id,
    quantity: it.quantity,
    unitPrice: it.unit_price,
    lineTotal: it.line_total,
  };
};

const mapSaleSnakeToCamel = (raw: any): Sale => {
  return {
    id: raw.id,
    customerId: raw.customer_id,
    locationId: raw.location_id,
    totalAmount: raw.total_amount,
    createdAt: raw.created_at,
    items: Array.isArray(raw.items) ? raw.items.map(mapItemSnakeToCamel) : [],
  };
};

// Convert frontend input to snake_case payload expected by API
const toSnakePayload = (input: SaleInput) => {
  return {
    customer_id: input.customerId,
    location_id: input.locationId,
    items: input.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
      unit_price: (i.price ?? i.quantity > 0) ? 0 : 0, // fallback to 0 if price not provided
    })),
    payment_method: input.paymentMethod,
  };
};

// API surface
export async function createSale(input: SaleInput): Promise<Sale> {
  const payload = toSnakePayload(input);
  const res = await api.post("/sales", payload);
  return mapSaleSnakeToCamel(res.data);
}

export async function getSales(): Promise<Sale[]> {
  const res = await api.get("/sales");
  // Backend returns snake_case array; map each item
  return Array.isArray(res.data)
    ? res.data.map((s: any) => mapSaleSnakeToCamel(s))
    : [];
}

export async function getSale(id: string): Promise<Sale> {
  const res = await api.get(`/sales/${id}`);
  return mapSaleSnakeToCamel(res.data);
}

export default {
  createSale,
  getSales,
  getSale,
};
