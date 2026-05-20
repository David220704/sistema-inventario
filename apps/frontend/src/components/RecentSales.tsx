"use client";

/** Recent sales list widget — displays recent sale dates, item summaries, and totals. Used on dashboard. */
import React from "react";
import { ShoppingCart } from "lucide-react";
import { Sale } from "@/lib/api";

/** Props for RecentSales — sale array and optional limit. */
export interface RecentSalesProps {
  sales: Sale[];
  limit?: number;
}

/** Renders sale list with date, first 2 product names, and total. Shows empty state if no sales. */
export default function RecentSales({
  sales,
  limit = 5,
}: RecentSalesProps) {
  const list = (sales ?? []).slice(0, limit);

  return (
    <div className="bg-white dark:bg-[#1e1f2e] border border-[#e5e7eb] dark:border-[#2a2b3d] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Ventas Recientes
      </h3>
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500">
          <ShoppingCart size={32} className="mb-2 opacity-60" />
          <p className="text-sm">No hay ventas registradas aún</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="truncate w-3/5">
                <span className="text-gray-800 dark:text-gray-100">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
                <span className="ml-2 text-gray-400 dark:text-gray-500">
                  {s.items
                    .slice(0, 2)
                    .map((it) =>
                      (it as any).product?.name ?? it.product_id.slice(0, 8),
                    )
                    .join(", ")}
                  {s.items.length > 2 && "..."}
                </span>
              </div>
              <span className="ml-2 text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">
                ${s.total.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
