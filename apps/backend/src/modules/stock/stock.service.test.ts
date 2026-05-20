import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { StockService } from "./stock.service";
import { PrismaService } from "@/database/prisma.service";
import { AlertsService } from "@/modules/alerts/alerts.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("StockService", () => {
  let service: StockService;
  let prisma: any;
  let alertsService: any;

  const tenantId = "tenant-123";

  const mockProduct = {
    id: "prod-1",
    name: "Test Product",
    tenant_id: tenantId,
  };

  const mockStock = {
    id: "stock-1",
    product_id: "prod-1",
    quantity: 10,
    location: "Warehouse A",
    product: mockProduct,
  };

  beforeEach(async () => {
    const mockPrisma = {
      stock: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      product: {
        findFirst: vi.fn(),
      },
      $executeRaw: vi.fn().mockResolvedValue([{ count: 0 }]),
    };

    const mockAlerts = {
      checkAndCreateAlert: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AlertsService, useValue: mockAlerts },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    prisma = module.get<PrismaService>(PrismaService);
    alertsService = module.get<AlertsService>(AlertsService);
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return stocks filtered by tenant", async () => {
      const mockStocks = [mockStock];
      prisma.stock.findMany.mockResolvedValue(mockStocks);

      const result = await service.findAll({}, tenantId);

      expect(result).toEqual(mockStocks);
      expect(prisma.stock.findMany).toHaveBeenCalledWith({
        where: { product: { tenant_id: tenantId } },
        include: { product: true },
        orderBy: { id: "asc" },
      });
    });

    it("should filter by product_id", async () => {
      prisma.stock.findMany.mockResolvedValue([mockStock]);

      await service.findAll({ product_id: "prod-1" }, tenantId);

      expect(prisma.stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ product_id: "prod-1" }),
        }),
      );
    });

    it("should filter by location", async () => {
      prisma.stock.findMany.mockResolvedValue([mockStock]);

      await service.findAll({ location: "Warehouse A" }, tenantId);

      expect(prisma.stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ location: "Warehouse A" }),
        }),
      );
    });

    it("should return empty array when no stocks", async () => {
      prisma.stock.findMany.mockResolvedValue([]);

      const result = await service.findAll({}, tenantId);

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return stock when found", async () => {
      prisma.stock.findFirst.mockResolvedValue(mockStock);

      const result = await service.findOne("stock-1", tenantId);

      expect(result).toEqual(mockStock);
      expect(prisma.stock.findFirst).toHaveBeenCalledWith({
        where: { id: "stock-1", product: { tenant_id: tenantId } },
        include: { product: true },
      });
    });

    it("should throw NotFoundException when stock not found", async () => {
      prisma.stock.findFirst.mockResolvedValue(null);

      await expect(service.findOne("nonexistent", tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("should create stock entry and sync quantity", async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.stock.create.mockResolvedValue(mockStock);

      const result = await service.create(
        { product_id: "prod-1", quantity: 10, location: "Warehouse A" },
        tenantId,
      );

      expect(result).toEqual(mockStock);
      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(alertsService.checkAndCreateAlert).toHaveBeenCalledWith(
        "prod-1",
        tenantId,
      );
    });

    it("should throw BadRequestException for cross-tenant product", async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          { product_id: "prod-other", quantity: 10, location: "Warehouse" },
          tenantId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("update", () => {
    it("should update stock quantity and sync", async () => {
      const updatedStock = { ...mockStock, quantity: 20 };
      prisma.stock.findFirst.mockResolvedValue(mockStock);
      prisma.stock.update.mockResolvedValue(updatedStock);

      const result = await service.update(
        "stock-1",
        { quantity: 20 },
        tenantId,
      );

      expect(result.quantity).toBe(20);
      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(alertsService.checkAndCreateAlert).toHaveBeenCalledWith(
        "prod-1",
        tenantId,
      );
    });

    it("should update location", async () => {
      const updatedStock = { ...mockStock, location: "Warehouse B" };
      prisma.stock.findFirst.mockResolvedValue(mockStock);
      prisma.stock.update.mockResolvedValue(updatedStock);

      const result = await service.update(
        "stock-1",
        { location: "Warehouse B" },
        tenantId,
      );

      expect(result.location).toBe("Warehouse B");
    });

    it("should throw NotFoundException when stock not found", async () => {
      prisma.stock.findFirst.mockResolvedValue(null);

      await expect(
        service.update("nonexistent", { quantity: 5 }, tenantId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should return stock unchanged when no fields to update", async () => {
      prisma.stock.findFirst.mockResolvedValue(mockStock);

      const result = await service.update("stock-1", {}, tenantId);

      expect(result).toEqual(mockStock);
      expect(prisma.stock.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should delete stock and sync quantity", async () => {
      prisma.stock.findFirst.mockResolvedValue(mockStock);

      const result = await service.remove("stock-1", tenantId);

      expect(result).toEqual({ deleted: true });
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(2); // DELETE + sync
      expect(alertsService.checkAndCreateAlert).toHaveBeenCalledWith(
        "prod-1",
        tenantId,
      );
    });

    it("should throw NotFoundException when stock not found", async () => {
      prisma.stock.findFirst.mockResolvedValue(null);

      await expect(service.remove("nonexistent", tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findByProduct", () => {
    it("should return stocks for a product", async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.stock.findMany.mockResolvedValue([mockStock]);

      const result = await service.findByProduct("prod-1", tenantId);

      expect(result).toEqual([mockStock]);
    });

    it("should throw NotFoundException for cross-tenant product", async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.findByProduct("prod-other", tenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== TENANT ISOLATION TESTS ====================

  describe("tenant isolation", () => {
    it("findOne should filter by tenant_id through product relation", async () => {
      prisma.stock.findFirst.mockResolvedValue(null); // other tenant

      await expect(
        service.findOne("stock-1", "other-tenant"),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.stock.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "stock-1", product: { tenant_id: "other-tenant" } },
        }),
      );
    });

    it("create should verify product belongs to tenant", async () => {
      prisma.product.findFirst.mockResolvedValue(null); // cross-tenant

      await expect(
        service.create(
          { product_id: "prod-1", quantity: 5, location: "Test" },
          "other-tenant",
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("update should verify stock belongs to tenant", async () => {
      prisma.stock.findFirst.mockResolvedValue(null); // other tenant

      await expect(
        service.update("stock-1", { quantity: 5 }, "other-tenant"),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.stock.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "stock-1", product: { tenant_id: "other-tenant" } },
        }),
      );
    });

    it("remove should verify stock belongs to tenant", async () => {
      prisma.stock.findFirst.mockResolvedValue(null); // other tenant

      await expect(
        service.remove("stock-1", "other-tenant"),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.stock.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "stock-1", product: { tenant_id: "other-tenant" } },
        }),
      );
    });
  });
});
