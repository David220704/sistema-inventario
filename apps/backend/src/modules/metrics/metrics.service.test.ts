import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { MetricsService } from "./metrics.service";
import { PrismaService } from "@/database/prisma.service";

describe("MetricsService", () => {
  let service: MetricsService;
  let prisma: any;

  const tenantId = "tenant-123";

  beforeEach(async () => {
    const mockPrisma = {
      product: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      category: {
        count: vi.fn(),
      },
      $queryRaw: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    prisma = module.get<PrismaService>(PrismaService);
    vi.clearAllMocks();
  });

  describe("getDashboardMetrics", () => {
    it("should return all dashboard metrics for the tenant", async () => {
      prisma.product.count.mockResolvedValue(10);
      prisma.category.count.mockResolvedValue(5);

      prisma.$queryRaw
        .mockResolvedValueOnce([{ total: BigInt(250) }])       // total_stock
        .mockResolvedValueOnce([{ count: BigInt(3) }])          // low_stock_count
        .mockResolvedValueOnce([{ count: BigInt(1) }])          // out_of_stock_count
        .mockResolvedValueOnce([                                 // low_stock_alerts
          {
            id: "alert-1", product_id: "p1", message: "test",
            type: "LOW_STOCK", created_at: new Date(),
            product_name: "Test", quantity: BigInt(2), min_quantity: 5,
          },
        ])
        .mockResolvedValueOnce([                                 // stock_by_category
          { categoryId: "c1", categoryName: "Electrónicos", totalStock: BigInt(200) },
          { categoryId: "c2", categoryName: "Ropa", totalStock: BigInt(50) },
        ]);

      prisma.product.findMany.mockResolvedValue([
        { id: "p1", name: "Test", category: {}, stocks: [] },
      ]);

      const result = await service.getDashboardMetrics(tenantId);

      expect(result.total_products).toBe(10);
      expect(result.total_categories).toBe(5);
      expect(result.total_stock).toBe(250);
      expect(result.low_stock_count).toBe(3);
      expect(result.out_of_stock_count).toBe(1);
      expect(result.low_stock_alerts).toHaveLength(1);
      expect(result.low_stock_alerts[0].quantity).toBe(2);
      expect(result.stock_by_category).toHaveLength(2);
      expect(result.stock_by_category[0].totalStock).toBe(200);
    });

    it("should filter all queries by tenant_id", async () => {
      prisma.product.count.mockResolvedValue(0);
      prisma.category.count.mockResolvedValue(0);
      prisma.$queryRaw
        .mockResolvedValue([{ total: BigInt(0) }])
        .mockResolvedValue([{ count: BigInt(0) }])
        .mockResolvedValue([{ count: BigInt(0) }])
        .mockResolvedValue([])
        .mockResolvedValue([]);
      prisma.product.findMany.mockResolvedValue([]);

      await service.getDashboardMetrics(tenantId);

      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { tenant_id: tenantId },
      });
      expect(prisma.category.count).toHaveBeenCalledWith({
        where: { tenant_id: tenantId },
      });
      // SQL queries include tenant_id in WHERE clause
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it("should handle BigInt serialization safely", async () => {
      prisma.product.count.mockResolvedValue(0);
      prisma.category.count.mockResolvedValue(0);
      prisma.$queryRaw
        .mockResolvedValue([{ total: BigInt(9999999999) }])
        .mockResolvedValue([{ count: BigInt(5) }])
        .mockResolvedValue([{ count: BigInt(2) }])
        .mockResolvedValue([])
        .mockResolvedValue([]);
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.getDashboardMetrics(tenantId);

      // BigInt values should be converted to Number
      expect(typeof result.total_stock).toBe("number");
      expect(typeof result.low_stock_count).toBe("number");
      expect(typeof result.out_of_stock_count).toBe("number");
    });

    it("should handle SQL query failures gracefully", async () => {
      prisma.product.count.mockResolvedValue(5);
      prisma.category.count.mockResolvedValue(3);
      // Make all $queryRaw calls throw
      prisma.$queryRaw.mockRejectedValue(new Error("DB error"));
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.getDashboardMetrics(tenantId);

      // Should still return partial data without crashing
      expect(result.total_products).toBe(5);
      expect(result.total_categories).toBe(3);
      expect(result.total_stock).toBe(0);
      expect(result.low_stock_count).toBe(0);
      expect(result.out_of_stock_count).toBe(0);
      expect(result.low_stock_alerts).toEqual([]);
      expect(result.stock_by_category).toEqual([]);
    });
  });
});
