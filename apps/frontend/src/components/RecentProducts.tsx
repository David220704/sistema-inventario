"use client";

/** Recent products list widget — displays a limited list of product names and SKUs with stock badges. Used on dashboard. */
import React from "react";
import { Package, AlertTriangle } from "lucide-react";
import { Product, getTotalStock } from "@/lib/api";

/** Props for RecentProducts — product array and optional limit to control how many to show. */
export interface RecentProductsProps {
  products: Product[];
  limit?: number;
}

/** Renders an unordered list of product names and SKUs with stock status badges. Shows empty state if no products. */
export default function RecentProducts({
  products,
  limit = 5,
}: RecentProductsProps) {
  const list = (products ?? []).slice(0, limit);

  const isLowStock = (p: Product) => {
    const stock = getTotalStock(p);
    const minQty = p.min_quantity ?? 0;
    return minQty > 0 && stock <= minQty;
  };

  return (
    <div className="bg-white dark:bg-[#1e1f2e] border border-[#e5e7eb] dark:border-[#2a2b3d] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Productos Recientes
      </h3>
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500">
          <Package size={32} className="mb-2 opacity-60" />
          <p className="text-sm">No hay productos aún</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((p) => {
            const lowStock = isLowStock(p);
            return (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="truncate w-3/4 text-gray-800 dark:text-gray-100">
                  {p.name}
                </span>
                <span className="flex items-center gap-1.5 ml-2 whitespace-nowrap">
                  {lowStock && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      <AlertTriangle size={10} />
                      Stock bajo
                    </span>
                  )}
                  <span className="text-gray-500 dark:text-gray-400">
                    {p.sku}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
