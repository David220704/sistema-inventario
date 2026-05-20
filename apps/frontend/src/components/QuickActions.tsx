"use client";

/** Quick action buttons — navigates to product creation, stock addition, product list, and stock list. Used on dashboard. */
import React from "react";
import { useRouter } from "next/navigation";

/** Renders four navigation buttons: Nuevo Producto, Agregar Stock, Ver Productos, Ver Stock. */
export default function QuickActions() {
  const router = useRouter();
  return (
    <div className="bg-white dark:bg-[#1e1f2e] border border-[#e5e7eb] dark:border-[#2a2b3d] rounded-xl p-4 flex flex-wrap gap-3">
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#38bdf8] text-white font-medium hover:bg-[#7dd3fc]"
        onClick={() => router.push("/dashboard/products")}
      >
        <span>Nuevo Producto</span>
      </button>
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2a2b3d] text-gray-800 dark:text-gray-100"
        onClick={() => router.push("/dashboard/stock")}
      >
        <span>Agregar Stock</span>
      </button>
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2a2b3d] text-gray-800 dark:text-gray-100"
        onClick={() => router.push("/dashboard/products")}
      >
        <span>Ver Productos</span>
      </button>
      <button
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2a2b3d] text-gray-800 dark:text-gray-100"
        onClick={() => router.push("/dashboard/stock")}
      >
        <span>Ver Stock</span>
      </button>
    </div>
  );
}
