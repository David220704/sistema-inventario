import { describe, it, expect, vi, beforeEach } from "vitest";
import { UsersService } from "@/users/users.service";
import { PrismaService } from "@/database/prisma.service";
import { NotFoundException } from "@nestjs/common";

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

describe("UsersService", () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService(mockPrisma as unknown as PrismaService);
    vi.clearAllMocks();
  });

  describe("getOnboardingStatus", () => {
    it("returns onboarding status when user found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        onboarding_completed: false,
        onboarding_step: 1,
      });

      const result = await service.getOnboardingStatus("user-123");

      expect(result).toEqual({
        onboarding_completed: false,
        onboarding_step: 1,
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        select: { onboarding_completed: true, onboarding_step: true },
      });
    });

    it("throws NotFoundException when user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getOnboardingStatus("nonexistent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateOnboardingStep", () => {
    it("updates and returns new step status", async () => {
      mockPrisma.user.update.mockResolvedValue({
        onboarding_completed: false,
        onboarding_step: 2,
      });

      const result = await service.updateOnboardingStep("user-123", { step: 2 });

      expect(result).toEqual({
        onboarding_completed: false,
        onboarding_step: 2,
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { onboarding_step: 2 },
        select: { onboarding_completed: true, onboarding_step: true },
      });
    });
  });

  describe("completeOnboarding", () => {
    it("marks onboarding as complete with step 3", async () => {
      mockPrisma.user.update.mockResolvedValue({
        onboarding_completed: true,
        onboarding_step: 3,
      });

      const result = await service.completeOnboarding("user-123");

      expect(result).toEqual({
        onboarding_completed: true,
        onboarding_step: 3,
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { onboarding_completed: true, onboarding_step: 3 },
        select: { onboarding_completed: true, onboarding_step: true },
      });
    });
  });
});
