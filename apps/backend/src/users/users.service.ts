/**
 * Users Service
 *
 * Lógica de negocio para operaciones de usuarios.
 * Gestiona el estado de onboarding de cada usuario.
 *
 * @module UsersService
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { UpdateOnboardingStepDto } from "./dto/update-onboarding-step.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el estado de onboarding de un usuario.
   * @param userId - ID del usuario (debe coincidir con el token JWT)
   * @returns Estado actual: { onboarding_completed, onboarding_step }
   */
  async getOnboardingStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboarding_completed: true,
        onboarding_step: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      onboarding_completed: user.onboarding_completed,
      onboarding_step: user.onboarding_step,
    };
  }

  /**
   * Actualiza el paso actual del onboarding.
   * @param userId - ID del usuario
   * @param dto - DTO con el paso (0-3)
   */
  async updateOnboardingStep(userId: string, dto: UpdateOnboardingStepDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboarding_step: dto.step,
      },
      select: {
        onboarding_completed: true,
        onboarding_step: true,
      },
    });

    return {
      onboarding_completed: user.onboarding_completed,
      onboarding_step: user.onboarding_step,
    };
  }

  /**
   * Marca el onboarding como completado.
   * @param userId - ID del usuario
   * @returns Estado actualizado
   */
  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboarding_completed: true,
        onboarding_step: 3, // Paso final
      },
      select: {
        onboarding_completed: true,
        onboarding_step: true,
      },
    });

    return {
      onboarding_completed: user.onboarding_completed,
      onboarding_step: user.onboarding_step,
    };
  }
}
