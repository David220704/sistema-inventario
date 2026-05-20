import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

const mockService = {
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
  exportData: vi.fn(),
  deleteAccount: vi.fn(),
};

const mockUser = {
  userId: "user-123",
  email: "test@test.com",
  tenant_id: "tenant-123",
  role: "ADMIN",
};

describe("SettingsController", () => {
  let controller: SettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    vi.clearAllMocks();
  });

  describe("GET /settings/profile", () => {
    it("calls service.getProfile and returns result", async () => {
      const expected = { id: "user-123", name: "David", email: "david@test.com" };
      mockService.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile(mockUser as any);

      expect(result).toEqual(expected);
      expect(mockService.getProfile).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("PATCH /settings/profile", () => {
    it("calls service.updateProfile with dto and user", async () => {
      const dto = { name: "Updated" };
      const expected = { id: "user-123", name: "Updated", email: "test@test.com" };
      mockService.updateProfile.mockResolvedValue(expected);

      const result = await controller.updateProfile(dto as any, mockUser as any);

      expect(result).toEqual(expected);
      expect(mockService.updateProfile).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe("POST /settings/password", () => {
    it("calls service.changePassword with dto and user", async () => {
      const dto = { oldPassword: "old", newPassword: "new12345" };
      mockService.changePassword.mockResolvedValue({ success: true });

      const result = await controller.changePassword(dto as any, mockUser as any);

      expect(result).toEqual({ success: true });
      expect(mockService.changePassword).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe("GET /settings/preferences", () => {
    it("calls service.getPreferences", async () => {
      mockService.getPreferences.mockResolvedValue({
        theme: "light",
        notifications: true,
      });

      const result = await controller.getPreferences(mockUser as any);

      expect(result).toEqual({ theme: "light", notifications: true });
      expect(mockService.getPreferences).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("PATCH /settings/preferences", () => {
    it("calls service.updatePreferences", async () => {
      const dto = { theme: "dark" };
      mockService.updatePreferences.mockResolvedValue({ theme: "dark", notifications: true });

      const result = await controller.updatePreferences(dto as any, mockUser as any);

      expect(result).toEqual({ theme: "dark", notifications: true });
      expect(mockService.updatePreferences).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe("POST /settings/export", () => {
    it("returns JSON with Content-Disposition header", async () => {
      const data = { products: [], stocks: [], sales: [] };
      mockService.exportData.mockResolvedValue(data);

      const mockSetHeader = vi.fn();
      const mockStatus = vi.fn().mockReturnValue({
        send: vi.fn().mockReturnValue(data),
      });
      const mockRes = {
        setHeader: mockSetHeader,
        status: mockStatus,
      };

      const result = await controller.exportData({} as any, mockUser as any, mockRes as any);

      expect(mockSetHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/json",
      );
      expect(mockSetHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        expect.stringContaining('attachment; filename="export-'),
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe("DELETE /settings/account", () => {
    it("calls service.deleteAccount", async () => {
      mockService.deleteAccount.mockResolvedValue({ deleted: true, id: "user-123" });

      const result = await controller.deleteAccount(mockUser as any);

      expect(result).toEqual({ deleted: true, id: "user-123" });
      expect(mockService.deleteAccount).toHaveBeenCalledWith(mockUser);
    });
  });
});
