import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { AlertsService } from "./alerts.service";
import { PrismaService } from "@/database/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("AlertsService", () => {
  let service: AlertsService;
  let prisma: any;

  const mockUser = { tenant_id: "tenant-123" };

  const mockProduct = {
    id: "prod-1",
    name: "Test Product",
    tenant_id: "tenant-123",
    min_quantity: 5,
    stocks: [{ quantity: 2 }],
  };

  const mockAlert = {
    id: "alert-1",
    product_id: "prod-1",
    type: "LOW_STOCK",
    message: '"Test Product" tiene stock bajo (2 unidades, mínimo 5)',
    is_read: false,
    tenant_id: "tenant-123",
    created_at: new Date(),
    product: { id: "prod-1", name: "Test Product" },
  };

  beforeEach(async () => {
    const mockPrisma = {
      alert: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      product: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    prisma = module.get<PrismaService>(PrismaService);
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return paginated alerts", async () => {
      prisma.alert.count.mockResolvedValue(1);
      prisma.alert.findMany.mockResolvedValue([mockAlert]);

      const result = await service.findAll({ page: 1, limit: 10 }, mockUser);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: { tenant_id: "tenant-123" },
        include: { product: true },
        orderBy: { created_at: "desc" },
        take: 10,
        skip: 0,
      });
    });

    it("should filter by type", async () => {
      prisma.alert.count.mockResolvedValue(0);
      prisma.alert.findMany.mockResolvedValue([]);

      await service.findAll({ type: "LOW_STOCK" as any }, mockUser);

      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "LOW_STOCK" }),
        }),
      );
    });

    it("should filter unread alerts", async () => {
      prisma.alert.count.mockResolvedValue(0);
      prisma.alert.findMany.mockResolvedValue([]);

      await service.findAll({ unread: true }, mockUser);

      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_read: false }),
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return alert when found", async () => {
      prisma.alert.findFirst.mockResolvedValue(mockAlert);

      const result = await service.findOne("alert-1", mockUser);

      expect(result).toEqual(mockAlert);
      expect(prisma.alert.findFirst).toHaveBeenCalledWith({
        where: { id: "alert-1", tenant_id: "tenant-123" },
        include: { product: true },
      });
    });

    it("should throw NotFoundException when alert not found", async () => {
      prisma.alert.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne("nonexistent", mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("markRead", () => {
    it("should mark alert as read", async () => {
      prisma.alert.findFirst.mockResolvedValue(mockAlert);
      prisma.alert.update.mockResolvedValue({ ...mockAlert, is_read: true });

      const result = await service.markRead("alert-1", mockUser);

      expect(result.is_read).toBe(true);
      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: "alert-1" },
        data: { is_read: true },
      });
    });

    it("should throw NotFoundException for cross-tenant alert", async () => {
      prisma.alert.findFirst.mockResolvedValue(null);

      await expect(service.markRead("alert-1", mockUser)).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.alert.findFirst).toHaveBeenCalledWith({
        where: { id: "alert-1", tenant_id: "tenant-123" },
      });
    });
  });

  describe("markAllRead", () => {
    it("should mark all unread alerts as read for tenant", async () => {
      prisma.alert.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllRead(mockUser);

      expect(result).toEqual({ updated: true, count: 3 });
      expect(prisma.alert.updateMany).toHaveBeenCalledWith({
        where: { tenant_id: "tenant-123", is_read: false },
        data: { is_read: true },
      });
    });

    it("should return count 0 when no unread alerts", async () => {
      prisma.alert.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllRead(mockUser);

      expect(result.count).toBe(0);
    });
  });

  describe("remove", () => {
    it("should delete alert when found", async () => {
      prisma.alert.findFirst.mockResolvedValue(mockAlert);
      prisma.alert.delete.mockResolvedValue(mockAlert);

      const result = await service.remove("alert-1", mockUser);

      expect(result).toEqual({ deleted: true, id: "alert-1" });
    });

    it("should throw NotFoundException for cross-tenant alert", async () => {
      prisma.alert.findFirst.mockResolvedValue(null);

      await expect(service.remove("nonexistent", mockUser)).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.alert.findFirst).toHaveBeenCalledWith({
        where: { id: "nonexistent", tenant_id: "tenant-123" },
      });
    });
  });

  describe("checkAndCreateAlert", () => {
    it("should create OUT_OF_STOCK alert when stock is 0", async () => {
      prisma.product.findFirst.mockResolvedValue({
        ...mockProduct,
        stocks: [{ quantity: 0 }],
      });
      prisma.alert.findFirst.mockResolvedValue(null);
      prisma.alert.create.mockResolvedValue({});

      await service.checkAndCreateAlert("prod-1", "tenant-123");

      expect(prisma.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "OUT_OF_STOCK",
            product_id: "prod-1",
            is_read: false,
          }),
        }),
      );
    });

    it("should create LOW_STOCK alert when stock <= min_quantity", async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct); // stock=2, min=5
      prisma.alert.findFirst.mockResolvedValue(null);
      prisma.alert.create.mockResolvedValue({});

      await service.checkAndCreateAlert("prod-1", "tenant-123");

      expect(prisma.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "LOW_STOCK",
            product_id: "prod-1",
            message: expect.stringContaining("stock bajo"),
          }),
        }),
      );
    });

    it("should not create duplicate alert if one already exists unread", async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.alert.findFirst.mockResolvedValue(mockAlert); // existing alert

      await service.checkAndCreateAlert("prod-1", "tenant-123");

      expect(prisma.alert.create).not.toHaveBeenCalled();
    });

    it("should auto-resolve (mark read) when stock is sufficient", async () => {
      const productWithGoodStock = {
        ...mockProduct,
        stocks: [{ quantity: 20 }],
      };
      prisma.product.findFirst.mockResolvedValue(productWithGoodStock);
      prisma.alert.updateMany.mockResolvedValue({ count: 1 });

      await service.checkAndCreateAlert("prod-1", "tenant-123");

      expect(prisma.alert.updateMany).toHaveBeenCalledWith({
        where: {
          product_id: "prod-1",
          tenant_id: "tenant-123",
          is_read: false,
        },
        data: { is_read: true },
      });
    });

    it("should silently return if product not found", async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.checkAndCreateAlert("nonexistent", "tenant-123"),
      ).resolves.not.toThrow();
    });
  });

  describe("generateAlerts", () => {
    it("should generate alerts for all products with low/out of stock", async () => {
      const products = [
        { id: "p1", name: "Out of Stock", min_quantity: 3, stocks: [{ quantity: 0 }] },
        { id: "p2", name: "Low Stock", min_quantity: 5, stocks: [{ quantity: 2 }] },
        { id: "p3", name: "Good Stock", min_quantity: 5, stocks: [{ quantity: 20 }] },
      ];
      prisma.product.findMany.mockResolvedValue(products);
      prisma.alert.findFirst.mockResolvedValue(null); // no existing alerts
      prisma.alert.create.mockResolvedValue({});

      const result = await service.generateAlerts("tenant-123");

      expect(result.created).toBe(2); // p1 (out) + p2 (low)
      expect(prisma.alert.create).toHaveBeenCalledTimes(2);
    });

    it("should skip products that already have alerts", async () => {
      const products = [
        { id: "p1", name: "Out of Stock", min_quantity: 3, stocks: [{ quantity: 0 }] },
      ];
      prisma.product.findMany.mockResolvedValue(products);
      prisma.alert.findFirst.mockResolvedValue(mockAlert); // existing

      const result = await service.generateAlerts("tenant-123");

      expect(result.created).toBe(0);
      expect(prisma.alert.create).not.toHaveBeenCalled();
    });
  });

  describe("stats", () => {
    it("should return alert counts", async () => {
      prisma.alert.count.mockResolvedValueOnce(5); // total
      prisma.alert.count.mockResolvedValueOnce(2); // unread
      prisma.alert.groupBy.mockResolvedValue([
        { type: "LOW_STOCK", _count: { id: 3 } },
        { type: "OUT_OF_STOCK", _count: { id: 2 } },
      ]);

      const result = await service.stats(mockUser);

      expect(result.total).toBe(5);
      expect(result.unread).toBe(2);
      expect(result.byType).toHaveLength(2);
    });

    it("should filter counts by tenant", async () => {
      prisma.alert.count.mockResolvedValue(0);
      prisma.alert.groupBy.mockResolvedValue([]);

      await service.stats(mockUser);

      expect(prisma.alert.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenant_id: "tenant-123" } }),
      );
    });
  });
});
