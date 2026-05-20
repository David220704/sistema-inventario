import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "@/users/users.controller";
import { UsersService } from "@/users/users.service";
import { ForbiddenException } from "@nestjs/common";

const mockService = {
  getOnboardingStatus: vi.fn(),
  updateOnboardingStep: vi.fn(),
  completeOnboarding: vi.fn(),
};

describe("UsersController", () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    vi.clearAllMocks();
  });

  const matchingUser = { userId: "user-123" };
  const mismatchedUser = { userId: "other-user" };

  describe("GET /users/:id/onboarding", () => {
    it("returns onboarding status when userId matches", async () => {
      mockService.getOnboardingStatus.mockResolvedValue({
        onboarding_completed: false,
        onboarding_step: 1,
      });

      const result = await controller.getOnboarding("user-123", matchingUser as any);

      expect(result).toEqual({ onboarding_completed: false, onboarding_step: 1 });
      expect(mockService.getOnboardingStatus).toHaveBeenCalledWith("user-123");
    });

    it("throws ForbiddenException when userId does not match", async () => {
      await expect(
        controller.getOnboarding("user-123", mismatchedUser as any),
      ).rejects.toThrow(ForbiddenException);

      expect(mockService.getOnboardingStatus).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /users/:id/onboarding/step", () => {
    it("updates step when userId matches", async () => {
      const dto = { step: 2 };
      mockService.updateOnboardingStep.mockResolvedValue({
        onboarding_completed: false,
        onboarding_step: 2,
      });

      const result = await controller.updateOnboardingStep(
        "user-123",
        dto as any,
        matchingUser as any,
      );

      expect(result).toEqual({ onboarding_completed: false, onboarding_step: 2 });
      expect(mockService.updateOnboardingStep).toHaveBeenCalledWith("user-123", dto);
    });

    it("throws ForbiddenException when userId does not match", async () => {
      await expect(
        controller.updateOnboardingStep("user-123", { step: 2 } as any, mismatchedUser as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("POST /users/:id/onboarding/complete", () => {
    it("completes onboarding when userId matches", async () => {
      mockService.completeOnboarding.mockResolvedValue({
        onboarding_completed: true,
        onboarding_step: 3,
      });

      const result = await controller.completeOnboarding(
        "user-123",
        {} as any,
        matchingUser as any,
      );

      expect(result).toEqual({ onboarding_completed: true, onboarding_step: 3 });
      expect(mockService.completeOnboarding).toHaveBeenCalledWith("user-123");
    });

    it("throws ForbiddenException when userId does not match", async () => {
      await expect(
        controller.completeOnboarding("user-123", {} as any, mismatchedUser as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
