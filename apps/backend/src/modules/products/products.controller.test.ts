import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { PrismaService } from "@/database/prisma.service";

describe("ProductsController", () => {
  let controller: ProductsController;
  let productsService: any;

  const mockUser = {
    userId: "user-123",
    email: "test@example.com",
    tenant_id: "tenant-123",
    role: "ADMIN",
  };

  const mockProduct = {
    id: "prod-1",
    name: "Test Product",
    sku: "SKU-0001",
    price: 100,
    tenant_id: "tenant-123",
    category: { id: "cat-1", name: "Electrónicos" },
    stocks: [],
  };

  beforeEach(async () => {
    const mockService = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return paginated products", async () => {
      productsService.findAll.mockResolvedValue({
        items: [mockProduct],
        total: 1,
      });

      const result = await controller.findAll(
        { page: 1, limit: 10 },
        mockUser,
      );

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.pages).toBe(1);
    });

    it("should pass query params to service", async () => {
      productsService.findAll.mockResolvedValue({ items: [], total: 0 });

      await controller.findAll(
        { page: 2, limit: 5, search: "arduino", category: "cat-1" },
        mockUser,
      );

      expect(productsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 5,
          search: "arduino",
          category: "cat-1",
        }),
        mockUser,
      );
    });

    it("should pass tenant context to service", async () => {
      productsService.findAll.mockResolvedValue({ items: [], total: 0 });

      await controller.findAll({ page: 1, limit: 10 }, mockUser);

      expect(productsService.findAll).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tenant_id: "tenant-123" }),
      );
    });
  });

  describe("findOne", () => {
    it("should return a product by id", async () => {
      productsService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne("prod-1", mockUser);

      expect(result).toEqual(mockProduct);
      expect(productsService.findOne).toHaveBeenCalledWith(
        "prod-1",
        mockUser,
      );
    });

    it("should throw when service throws", async () => {
      productsService.findOne.mockRejectedValue(
        new Error("Product not found"),
      );

      await expect(
        controller.findOne("nonexistent", mockUser),
      ).rejects.toThrow("Product not found");
    });
  });

  describe("create", () => {
    it("should create a product", async () => {
      const dto = {
        name: "New Product",
        category_id: "cat-1",
        price: 100,
      };
      productsService.create.mockResolvedValue(mockProduct);

      const result = await controller.create(dto, mockUser);

      expect(result).toEqual(mockProduct);
      expect(productsService.create).toHaveBeenCalledWith(dto, mockUser);
    });

    it("should pass tenant context to service", async () => {
      productsService.create.mockResolvedValue(mockProduct);

      await controller.create(
        { name: "Test", category_id: "cat-1", price: 50 },
        mockUser,
      );

      expect(productsService.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tenant_id: "tenant-123" }),
      );
    });
  });

  describe("update", () => {
    it("should update a product", async () => {
      const dto = { name: "Updated" };
      productsService.update.mockResolvedValue({
        ...mockProduct,
        name: "Updated",
      });

      const result = await controller.update("prod-1", dto, mockUser);

      expect(result!.name).toBe("Updated");
      expect(productsService.update).toHaveBeenCalledWith(
        "prod-1",
        dto,
        mockUser,
      );
    });
  });

  describe("remove", () => {
    it("should delete a product", async () => {
      productsService.remove.mockResolvedValue({
        deleted: true,
        id: "prod-1",
      });

      const result = await controller.remove("prod-1", mockUser);

      expect(result).toEqual({ deleted: true, id: "prod-1" });
      expect(productsService.remove).toHaveBeenCalledWith(
        "prod-1",
        mockUser,
      );
    });
  });
});
