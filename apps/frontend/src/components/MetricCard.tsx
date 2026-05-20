"use client";

/** Metric card widget — displays a numeric value with label and optional icon. Used on dashboard for KPIs. */
import React from "react";

type IconType = React.ComponentType<{ className?: string }>;

/** Props for MetricCard — title, optional value display, and optional icon component. */
export interface MetricCardProps {
  title: string;
  value?: string | number;
  Icon?: IconType;
}

/**
 * Renders a card with a large numeric value, label below, and optional icon in a colored circle.
 * Handles null/undefined value by showing dash. Supports dark mode via Tailwind dark: classes.
 * @param props - Component props.
 * @param props.title - Label displayed below the value.
 * @param props.value - Numeric or string value to display (shows dash if null/undefined).
 * @param props.Icon - Optional Lucide icon component rendered in a colored circle.
 */
export default function MetricCard({ title, value, Icon }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-[#1e1f2e] border border-[#e5e7eb] dark:border-[#2a2b3d] rounded-xl p-5 transition-all">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold text-[#1f2937] dark:text-[#e5e7eb]">
          {value ?? "-"}
        </div>
        {Icon ? (
          <div className="w-10 h-10 rounded-lg bg-[#eef2ff] dark:bg-[#312e81]/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Icon className="w-5 h-5" />
          </div>
        ) : null}
      </div>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {title}
      </div>
    </div>
  );
}
