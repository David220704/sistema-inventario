import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductsService } from "./products.service";
import { PrismaService } from "@/database/prisma.service";
import { NotFoundException } from "@nestjs/common";

// Mock PrismaService
const mockPrisma = {
  product: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  category: {
    findMany: vi.fn(),
  },
};

// Mock user for tests
const mockUser = {
  tenant_id: "tenant-123",
  id: "user-123",
};

describe("ProductsService", () => {
  let service: ProductsService;

  beforeEach(() => {
    service = new ProductsService(mockPrisma as unknown as PrismaService);
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return products with pagination", async () => {
      const mockProducts = [
        { id: "1", name: "Product 1", tenant_id: "tenant-123" },
        { id: "2", name: "Product 2", tenant_id: "tenant-123" },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 }, mockUser);

      expect(result).toEqual({ items: mockProducts, total: 2 });
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { tenant_id: "tenant-123" },
        include: { category: true, stocks: true },
        take: 10,
        skip: 0,
        orderBy: { id: "asc" },
      });
      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: { tenant_id: "tenant-123" },
      });
    });

    it("should apply search filter", async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ search: "test", page: 1, limit: 10 }, mockUser);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: "test", mode: "insensitive" } },
              { description: { contains: "test", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });

    it("should apply category filter by id", async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll(
        { category: "cat-uuid", page: 1, limit: 10 },
        mockUser,
      );

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category_id: "cat-uuid",
          }),
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return product when found", async () => {
      const mockProduct = {
        id: "1",
        name: "Product 1",
        tenant_id: "tenant-123",
      };
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);

      const result = await service.findOne("1", mockUser);

      expect(result).toEqual(mockProduct);
    });

    it("should throw NotFoundException when product not found", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne("nonexistent", mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("should create product with auto-generated SKU", async () => {
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.product.create.mockResolvedValue({
        id: "new-product",
        name: "New Product",
        sku: "SKU-0001",
        tenant_id: "tenant-123",
      });

      const result = await service.create(
        { name: "New Product", category_id: "cat-1", price: 100 },
        mockUser,
      );

      expect(result.sku).toBe("SKU-0001");
      expect(mockPrisma.product.create).toHaveBeenCalled();
    });

    it("should use provided SKU when given", async () => {
      mockPrisma.product.create.mockResolvedValue({
        id: "new-product",
        name: "New Product",
        sku: "CUSTOM-SKU",
        tenant_id: "tenant-123",
      });

      const result = await service.create(
        {
          name: "New Product",
          category_id: "cat-1",
          price: 100,
          sku: "CUSTOM-SKU",
        },
        mockUser,
      );

      expect(result.sku).toBe("CUSTOM-SKU");
    });
  });

  describe("update", () => {
    it("should update product successfully", async () => {
      const mockProduct = { id: "1", name: "Updated", tenant_id: "tenant-123" };
      mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);

      const result = await service.update("1", { name: "Updated" }, mockUser);

      expect(result).toEqual(mockProduct);
    });

    it("should throw NotFoundException when product not found", async () => {
      mockPrisma.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update("nonexistent", { name: "Updated" }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete product successfully", async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: "1" });
      mockPrisma.product.delete.mockResolvedValue({ id: "1" });

      const result = await service.remove("1", mockUser);

      expect(result).toEqual({ deleted: true, id: "1" });
    });

    it("should throw NotFoundException when product not found", async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.remove("nonexistent", mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
