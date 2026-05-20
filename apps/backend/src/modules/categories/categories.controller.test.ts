import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { CategoriesController } from "./categories.controller";
import { PrismaService } from "@/database/prisma.service";
import { NotFoundException, ConflictException } from "@nestjs/common";

describe("CategoriesController", () => {
  let controller: CategoriesController;
  let prisma: any;

  const mockUser = { tenant_id: "tenant-123" };

  beforeEach(async () => {
    const mockPrisma = {
      category: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    prisma = module.get<PrismaService>(PrismaService);
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return categories filtered by tenant", async () => {
      const mockCategories = [
        { id: "cat-1", name: "Electrónicos", tenant_id: "tenant-123" },
        { id: "cat-2", name: "Ropa", tenant_id: "tenant-123" },
      ];
      prisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { tenant_id: "tenant-123" },
        orderBy: { name: "asc" },
      });
    });

    it("should return empty array when no categories", async () => {
      prisma.category.findMany.mockResolvedValue([]);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return category when found", async () => {
      const mockCategory = {
        id: "cat-1",
        name: "Electrónicos",
        tenant_id: "tenant-123",
      };
      prisma.category.findFirst.mockResolvedValue(mockCategory);

      const result = await controller.findOne("cat-1", mockUser);

      expect(result).toEqual(mockCategory);
      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: { id: "cat-1", tenant_id: "tenant-123" },
      });
    });

    it("should throw NotFoundException when category not found", async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        controller.findOne("nonexistent", mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create category", async () => {
      const mockCategory = {
        id: "cat-1",
        name: "Nueva Categoría",
        slug: "nueva-categoria",
        tenant_id: "tenant-123",
      };
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue(mockCategory);

      const result = await controller.create(
        { name: "Nueva Categoría", slug: "nueva-categoria" },
        mockUser,
      );

      expect(result).toEqual(mockCategory);
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "Nueva Categoría",
          description: undefined,
          slug: "nueva-categoria",
          tenant_id: "tenant-123",
        },
      });
    });

    it("should throw ConflictException when slug already exists", async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: "existing",
        slug: "nueva-categoria",
      });

      await expect(
        controller.create(
          { name: "Nueva Categoría", slug: "nueva-categoria" },
          mockUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("update", () => {
    it("should update category", async () => {
      const existingCategory = {
        id: "cat-1",
        name: "Old Name",
        tenant_id: "tenant-123",
      };
      const updatedCategory = {
        id: "cat-1",
        name: "New Name",
        tenant_id: "tenant-123",
      };
      prisma.category.findFirst
        .mockResolvedValueOnce(existingCategory)
        .mockResolvedValueOnce(updatedCategory);
      prisma.category.update.mockResolvedValue(updatedCategory);

      const result = await controller.update(
        "cat-1",
        { name: "New Name" },
        mockUser,
      );

      expect(result.name).toBe("New Name");
      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: { id: "cat-1", tenant_id: "tenant-123" },
      });
    });

    it("should throw NotFoundException when category not found", async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        controller.update("nonexistent", { name: "New" }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete category", async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: "cat-1",
        tenant_id: "tenant-123",
      });
      prisma.category.delete.mockResolvedValue({ id: "cat-1" });

      const result = await controller.remove("cat-1", mockUser);

      expect(result).toEqual({ deleted: true, id: "cat-1" });
    });

    it("should throw NotFoundException when category not found", async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        controller.remove("nonexistent", mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("seed", () => {
    it("should create default categories if not exist", async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue({});
      prisma.category.findMany.mockResolvedValue([
        { name: "Electrónicos" },
        { name: "Ropa" },
      ]);

      const result = await controller.seed(mockUser);

      expect(result.message).toContain("Categorías disponibles");
      expect(prisma.category.create).toHaveBeenCalled();
    });

    it("should not create duplicate categories", async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: "existing",
        name: "Electrónicos",
      });
      prisma.category.findMany.mockResolvedValue([
        { name: "Electrónicos" },
        { name: "Ropa" },
      ]);

      const result = await controller.seed(mockUser);

      expect(prisma.category.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Electrónicos" }),
        }),
      );
    });
  });
});
