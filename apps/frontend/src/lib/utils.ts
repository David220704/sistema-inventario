/** Utility for merging Tailwind CSS class names — combines clsx and tailwind-merge for conflict-free class composition. */

/**
 * Generates and downloads a CSV file from headers and rows.
 * @param filename - Output filename (e.g. "productos.csv")
 * @param headers - Column headers array
 * @param rows - 2D array of row data
 */
export function exportToCsv(filename: string, headers: string[], rows: string[][]): void {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class values using clsx then tailwind-merge to resolve conflicting Tailwind utilities.
 * @param inputs - Class values (strings, objects, arrays) to merge.
 * @returns A single merged className string with Tailwind conflicts resolved.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
