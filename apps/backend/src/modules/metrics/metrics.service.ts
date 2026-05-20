import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";

/**
 * MetricsService
 * Aggregates inventory metrics for the dashboard. All queries are tenant-scoped
 * using the provided tenantId. Computes total products, total stock, low/out-of-stock
 * counts, recent products, stock distribution by category, and recent alerts.
 */
@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches all dashboard metrics for a given tenant.
   * @param tenantId - The tenant to scope queries to
   * @returns Dashboard metrics object with counts, alerts, and distribution data
   */
  async getDashboardMetrics(tenantId: string): Promise<any> {
    try {
      console.debug(
        "[Metrics] Dashboard metrics: starting fetch for tenant",
        tenantId,
      );
      // 1) Total products for the tenant
      const total_products = await this.prisma.product.count({
        where: { tenant_id: tenantId },
      });
      console.debug("[Metrics] Total products:", total_products);

      // 2) Total categories for the tenant
      const total_categories = await this.prisma.category.count({
        where: { tenant_id: tenantId },
      });
      console.debug("[Metrics] Total categories:", total_categories);

      // 3) Total stock across all products (sum of quantities)
      let total_stock = 0;
      try {
        const stockRes = await this.prisma.$queryRaw<{ total: bigint }[]>`
          SELECT COALESCE(SUM(s.quantity), 0) AS total
          FROM "Stock" s
          JOIN "Product" p ON s."product_id" = p.id
          WHERE p."tenant_id" = ${tenantId}
        `;
        total_stock = stockRes?.[0]?.total ? Number(stockRes[0].total) : 0;
        console.debug("[Metrics] Total stock:", total_stock);
      } catch (e) {
        console.error("[Metrics] Error fetching total stock:", e);
        total_stock = 0;
      }

      // 4) Low stock count: total stock per product <= min_quantity (from Stock)
      let low_stock_count = 0;
      try {
        const lowStockRes = await this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) AS count
          FROM (
            SELECT p.id
            FROM "Product" p
            LEFT JOIN "Stock" s ON s."product_id" = p.id
            WHERE p."tenant_id" = ${tenantId}
            GROUP BY p.id
            HAVING COALESCE(SUM(s.quantity), 0) <= COALESCE(MIN(p.min_quantity), 0)
          ) AS t
        `;
        low_stock_count = lowStockRes?.[0]?.count
          ? Number(lowStockRes[0].count)
          : 0;
        console.debug("[Metrics] Low stock count:", low_stock_count);
      } catch (e) {
        console.error("[Metrics] Error fetching low stock count:", e);
        low_stock_count = 0;
      }

      // 5) Out of stock count: total per product equals 0
      let out_of_stock_count = 0;
      try {
        const outOfStockRes = await this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) AS count
          FROM (
            SELECT p.id
            FROM "Product" p
            LEFT JOIN "Stock" s ON s."product_id" = p.id
            WHERE p."tenant_id" = ${tenantId}
            GROUP BY p.id
            HAVING COALESCE(SUM(s.quantity), 0) = 0
          ) AS t
        `;
        out_of_stock_count = outOfStockRes?.[0]?.count
          ? Number(outOfStockRes[0].count)
          : 0;
        console.debug("[Metrics] Out of stock count:", out_of_stock_count);
      } catch (e) {
        console.error("[Metrics] Error fetching out of stock count:", e);
        out_of_stock_count = 0;
      }

      // 6) Low stock alerts for the tenant - include product name via join
      let low_stock_alerts: any[] = [];
      try {
        const alerts = await this.prisma.$queryRaw<any[]>`
          SELECT a.id, a.product_id, a.message, a.type, a.created_at, p.name AS product_name, COALESCE((SELECT SUM(s.quantity) FROM "Stock" s WHERE s.product_id = p.id), 0) AS quantity, p.min_quantity
          FROM "Alert" a
          LEFT JOIN "Product" p ON p.id = a.product_id
          WHERE a."tenant_id" = ${tenantId}
          ORDER BY a.created_at DESC
          LIMIT 10
        `;
        low_stock_alerts = alerts ?? [];
        console.debug(
          "[Metrics] Low stock alerts fetched:",
          low_stock_alerts.length,
        );
      } catch (e) {
        console.error("[Metrics] Error fetching alerts:", e);
        low_stock_alerts = [];
      }

      // 7) Recent products (last 5 created)
      const recent_products = await this.prisma.product.findMany({
        where: { tenant_id: tenantId },
        orderBy: { created_at: "desc" },
        take: 5,
        include: { category: true, stocks: true },
      });
      console.debug("[Metrics] Recent products:", recent_products.length);

      // 8) Stock by category
      let stockByCategory: any[] = [];
      try {
        const stockCat = await this.prisma.$queryRaw<
          { categoryId: string; categoryName: string; totalStock: bigint }[]
        >`
          SELECT c.id AS "categoryId", c.name AS "categoryName", COALESCE(SUM(s.quantity), 0) AS "totalStock"
          FROM "Category" c
          LEFT JOIN "Product" p ON p.category_id = c.id
          LEFT JOIN "Stock" s ON s.product_id = p.id
          WHERE c."tenant_id" = ${tenantId}
          GROUP BY c.id, c.name
          ORDER BY "totalStock" DESC
        `;
        // Convert BigInt to number for JSON serialization
        stockByCategory = (stockCat ?? []).map((row) => ({
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          totalStock: Number(row.totalStock),
        }));
        console.debug(
          "[Metrics] Stock by category rows:",
          stockByCategory.length,
        );
      } catch (e) {
        console.error("[Metrics] Error fetching stock by category:", e);
        stockByCategory = [];
      }

      // Build response — use JSON.parse/stringify with BigInt replacer to ensure clean output
      const rawOutput = {
        total_products,
        total_categories,
        total_stock,
        low_stock_count,
        out_of_stock_count,
        low_stock_alerts,
        recent_products: recent_products ?? [],
        stock_by_category: stockByCategory,
      };

      // Use JSON.stringify with a BigInt → Number replacer, then parse back
      const safeReturn = JSON.parse(
        JSON.stringify(rawOutput, (_key: string, value: any) =>
          typeof value === 'bigint' ? Number(value) : value,
        ),
      );

      console.debug(
        "[Metrics] Final return:",
        JSON.stringify(safeReturn, null, 2),
      );
      return safeReturn;
    } catch (error) {
      console.error("[Metrics] Error fetching dashboard metrics:", error);
      // Throw generic error - controller will convert to 500
      throw new Error(
        `Error fetching metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
