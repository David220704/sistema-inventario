import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsService } from "./settings.service";
import { PrismaService } from "@/database/prisma.service";
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";

// bcrypt is ESM - must use vi.mock instead of vi.spyOn
vi.mock("bcrypt", () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

import * as bcrypt from "bcrypt";

const mockPrisma = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
  },
  stock: {
    findMany: vi.fn(),
  },
  sale: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn((cb: any) => cb(mockPrisma)),
};

const mockUser = {
  userId: "user-123",
  tenant_id: "tenant-123",
  email: "test@test.com",
};

describe("SettingsService", () => {
  let service: SettingsService;

  beforeEach(() => {
    service = new SettingsService(mockPrisma as unknown as PrismaService);
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("returns user id, name, email when found", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-123",
        name: "David",
        email: "david@test.com",
      });

      const result = await service.getProfile(mockUser);

      expect(result).toEqual({
        id: "user-123",
        name: "David",
        email: "david@test.com",
      });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: "user-123", tenant_id: "tenant-123" },
      });
    });

    it("throws NotFoundException when user not found", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getProfile(mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateProfile", () => {
    it("updates and returns user profile", async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: "user-123",
        name: "Updated",
        email: "updated@test.com",
      });

      const result = await service.updateProfile(
        { name: "Updated", email: "updated@test.com" },
        mockUser,
      );

      expect(result).toEqual({
        id: "user-123",
        name: "Updated",
        email: "updated@test.com",
      });
    });

    it("throws BadRequestException on unique constraint violation", async () => {
      mockPrisma.user.update.mockRejectedValue(new Error("Unique constraint"));

      await expect(
        service.updateProfile({ name: "New" }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("changePassword", () => {
    it("changes password successfully", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-123",
        password: "$2b$10$hashedpassword",
      });
      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue("$2b$10$newhash");
      mockPrisma.user.update.mockResolvedValue({ id: "user-123" });

      const result = await service.changePassword(
        { oldPassword: "old", newPassword: "new12345" },
        mockUser,
      );

      expect(result).toEqual({ success: true });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "old",
        "$2b$10$hashedpassword",
      );
    });

    it("throws UnauthorizedException with wrong password", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-123",
        password: "$2b$10$hashed",
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        service.changePassword(
          { oldPassword: "wrong", newPassword: "new12345" },
          mockUser,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws NotFoundException when user not found", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.changePassword(
          { oldPassword: "old", newPassword: "new12345" },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getPreferences", () => {
    it("returns default preferences", async () => {
      const result = await service.getPreferences(mockUser);

      expect(result).toEqual({
        theme: "light",
        notifications: true,
      });
    });
  });

  describe("updatePreferences", () => {
    it("echoes back validated preferences", async () => {
      const result = await service.updatePreferences(
        { theme: "dark", notifications: false },
        mockUser,
      );

      expect(result).toEqual({ theme: "dark", notifications: false });
    });

    it("applies defaults for missing fields", async () => {
      const result = await service.updatePreferences({}, mockUser);

      expect(result).toEqual({ theme: "light", notifications: true });
    });
  });

  describe("exportData", () => {
    it("returns products, stocks, and sales for the tenant", async () => {
      const mockProducts = [{ id: "p1", name: "Prod" }];
      const mockStocks = [{ id: "s1", quantity: 10 }];
      const mockSales = [{ id: "sale-1", total: 100 }];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.stock.findMany.mockResolvedValue(mockStocks);
      mockPrisma.sale.findMany.mockResolvedValue(mockSales);

      const result = await service.exportData({} as any, mockUser);

      expect(result).toEqual({
        products: mockProducts,
        stocks: mockStocks,
        sales: mockSales,
      });
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { tenant_id: "tenant-123" },
        include: { category: true, stocks: true },
      });
      expect(mockPrisma.stock.findMany).toHaveBeenCalledWith({
        where: { product: { tenant_id: "tenant-123" } },
      });
      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith({
        where: { tenant_id: "tenant-123" },
      });
    });
  });

  describe("deleteAccount", () => {
    it("deletes user and returns confirmation", async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.user.delete.mockResolvedValue({ id: "user-123" });

      const result = await service.deleteAccount(mockUser);

      expect(result).toEqual({ deleted: true, id: "user-123" });
    });
  });
});
