import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { AlertsController } from "./alerts.controller";
import { AlertsService } from "./alerts.service";

const mockService = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  remove: vi.fn(),
  stats: vi.fn(),
  generateAlerts: vi.fn(),
};

const mockUser = {
  userId: "user-123",
  email: "test@test.com",
  tenant_id: "tenant-123",
  role: "ADMIN",
};

describe("AlertsController", () => {
  let controller: AlertsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [{ provide: AlertsService, useValue: mockService }],
    }).compile();

    controller = module.get<AlertsController>(AlertsController);
    vi.clearAllMocks();
  });

  describe("GET /alerts", () => {
    it("returns paginated alerts with calculated pages", async () => {
      mockService.findAll.mockResolvedValue({
        items: [{ id: "alert-1", type: "LOW_STOCK" }],
        total: 25,
      });

      const result = await controller.findAll({ page: "2", limit: "10" } as any, mockUser as any);

      expect(result).toEqual({
        items: [{ id: "alert-1", type: "LOW_STOCK" }],
        total: 25,
        page: 2,
        limit: 10,
        pages: 3,
      });
      expect(mockService.findAll).toHaveBeenCalledWith(
        { page: "2", limit: "10" },
        mockUser,
      );
    });

    it("applies defaults when no query params", async () => {
      mockService.findAll.mockResolvedValue({ items: [], total: 0 });

      const result = await controller.findAll({} as any, mockUser as any);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.pages).toBe(0);
    });
  });

  describe("GET /alerts/:id", () => {
    it("returns alert when found", async () => {
      const alert = {
        id: "alert-1",
        type: "LOW_STOCK",
        product: { id: "p1", name: "Test" },
      };
      mockService.findOne.mockResolvedValue(alert);

      const result = await controller.findOne("alert-1", mockUser as any);

      expect(result).toEqual(alert);
      expect(mockService.findOne).toHaveBeenCalledWith("alert-1", mockUser);
    });
  });

  describe("PATCH /alerts/:id/read", () => {
    it("marks alert as read", async () => {
      const readAlert = { id: "alert-1", is_read: true };
      mockService.markRead.mockResolvedValue(readAlert);

      const result = await controller.markRead("alert-1", mockUser as any);

      expect(result).toEqual(readAlert);
      expect(mockService.markRead).toHaveBeenCalledWith("alert-1", mockUser);
    });
  });

  describe("POST /alerts/read-all", () => {
    it("marks all alerts as read", async () => {
      mockService.markAllRead.mockResolvedValue({ updated: true, count: 5 });

      const result = await controller.markAllRead(mockUser as any);

      expect(result).toEqual({ updated: true, count: 5 });
    });
  });

  describe("DELETE /alerts/:id", () => {
    it("removes alert", async () => {
      mockService.remove.mockResolvedValue({ deleted: true, id: "alert-1" });

      const result = await controller.remove("alert-1", mockUser as any);

      expect(result).toEqual({ deleted: true, id: "alert-1" });
    });
  });

  describe("GET /alerts/stats", () => {
    it("returns alert stats", async () => {
      mockService.stats.mockResolvedValue({
        total: 10,
        unread: 3,
        byType: [{ type: "LOW_STOCK", count: 2 }],
      });

      const result = await controller.stats(mockUser as any);

      expect(result).toEqual({
        total: 10,
        unread: 3,
        byType: [{ type: "LOW_STOCK", count: 2 }],
      });
    });
  });

  describe("POST /alerts/generate", () => {
    it("generates alerts and returns count", async () => {
      mockService.generateAlerts.mockResolvedValue({ created: 3 });

      const result = await controller.generate(mockUser as any);

      expect(result).toEqual({ created: 3 });
      expect(mockService.generateAlerts).toHaveBeenCalledWith("tenant-123");
    });
  });
});
