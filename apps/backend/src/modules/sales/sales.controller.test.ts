import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SalesController } from "./sales.controller";
import { PrismaService } from "@/database/prisma.service";
import { AlertsService } from "@/modules/alerts/alerts.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("SalesController", () => {
  let controller: SalesController;
  let prisma: any;

  const mockUser = { tenant_id: "tenant-123" };

  beforeEach(async () => {
    const mockPrisma = {
      sale: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      stock: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      saleItem: {
        create: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(mockPrisma)),
      $executeRaw: vi.fn(),
    };

    const mockAlertsService = {
      checkAndCreateAlert: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AlertsService, useValue: mockAlertsService },
      ],
    }).compile();

    controller = module.get<SalesController>(SalesController);
    prisma = module.get<PrismaService>(PrismaService);
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a sale and decrement stock", async () => {
      const mockSale = {
        id: "sale-1",
        total: 100,
        tenant_id: "tenant-123",
        status: "COMPLETED",
      };

      const mockStock = { id: "stock-1", quantity: 10, product_id: "prod-1" };

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          sale: { create: vi.fn().mockResolvedValue(mockSale) },
          stock: {
            findFirst: vi.fn().mockResolvedValue(mockStock),
            update: vi.fn(),
          },
          saleItem: { create: vi.fn() },
          $executeRaw: vi.fn(),
        };
        return cb(tx);
      });

      prisma.sale.findUnique.mockResolvedValue({
        ...mockSale,
        items: [{ id: "item-1", quantity: 1, unit_price: 100 }],
      });

      const result = await controller.create(
        { items: [{ product_id: "prod-1", quantity: 1, unit_price: 100 }] },
        mockUser,
      );

      expect(result!.total).toBe(100);
      expect(result!.items).toHaveLength(1);
    });

    it("should throw BadRequestException when insufficient stock", async () => {
      const mockStock = { id: "stock-1", quantity: 5, product_id: "prod-1" };

      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          sale: { create: vi.fn() },
          stock: {
            findFirst: vi.fn().mockResolvedValue(mockStock),
            update: vi.fn(),
          },
          saleItem: { create: vi.fn() },
        };
        return cb(tx);
      });

      await expect(
        controller.create(
          { items: [{ product_id: "prod-1", quantity: 10, unit_price: 100 }] },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when stock not found", async () => {
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          sale: { create: vi.fn() },
          stock: {
            findFirst: vi.fn().mockResolvedValue(null),
            update: vi.fn(),
          },
          saleItem: { create: vi.fn() },
        };
        return cb(tx);
      });

      await expect(
        controller.create(
          { items: [{ product_id: "prod-1", quantity: 1, unit_price: 100 }] },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated sales", async () => {
      const mockSales = [
        { id: "sale-1", total: 100, tenant_id: "tenant-123" },
        { id: "sale-2", total: 200, tenant_id: "tenant-123" },
      ];

      prisma.sale.findMany.mockResolvedValue(mockSales);
      prisma.sale.count.mockResolvedValue(2);

      const result = await controller.findAll(mockUser, { page: 1, limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
    });
  });

  describe("findOne", () => {
    it("should return sale when found", async () => {
      const mockSale = { id: "sale-1", total: 100, tenant_id: "tenant-123" };
      prisma.sale.findFirst.mockResolvedValue(mockSale);

      const result = await controller.findOne("sale-1", mockUser);

      expect(result).toEqual(mockSale);
    });

    it("should throw NotFoundException when sale not found", async () => {
      prisma.sale.findFirst.mockResolvedValue(null);

      await expect(controller.findOne("nonexistent", mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
