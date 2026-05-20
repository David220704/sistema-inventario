"use client";

/** Stock alerts widget — lists products below minimum stock threshold with quantity. Used on dashboard. */
import React from "react";
import { CheckCircle } from "lucide-react";

/** A single stock alert — product ID, name, current quantity, and minimum threshold. */
export interface StockAlert {
  productId: string;
  productName?: string;
  quantity: number;
  minQuantity: number;
  location?: string;
}

/** Props for StockAlerts — array of low-stock alerts. */
export interface StockAlertsProps {
  alerts: StockAlert[];
}

/** Renders alert list with product name and quantity in red. Shows empty state message if no alerts. */
export default function StockAlerts({ alerts }: StockAlertsProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e1f2e] border border-[#e5e7eb] dark:border-[#2a2b3d] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Alertas de Stock Bajo
        </h3>
        <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500">
          <CheckCircle size={32} className="mb-2 opacity-60" />
          <p className="text-sm">Todo en orden — sin alertas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1e1f2e] border border-[#e5e7eb] dark:border-[#2a2b3d] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Alertas de Stock Bajo
      </h3>
      <ul className="space-y-2">
        {alerts.map((a) => (
          <li
            key={a.productId}
            className="flex items-center justify-between text-sm"
          >
            <span className="truncate w-3/4 text-gray-800 dark:text-gray-100">
              {a.productName ?? a.productId}
            </span>
            <span className="ml-2 text-rose-600 dark:text-rose-400 font-medium">
              {a.quantity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
