/**
 * Users Controller
 *
 * Maneja los endpoints relacionados con usuarios, específicamente el flujo de onboarding.
 * Todos los endpoints requieren autenticación JWT y el usuario solo puede acceder a sus propios datos.
 *
 * Endpoints:
 *   GET    /users/:id/onboarding        - Obtener estado de onboarding
 *   PATCH  /users/:id/onboarding/step   - Actualizar paso actual (0-3)
 *   POST   /users/:id/onboarding/complete - Marcar onboarding como completado
 *
 * @module UsersController
 */

import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import { UpdateOnboardingStepDto } from "./dto/update-onboarding-step.dto";
import { CompleteOnboardingDto } from "./dto/complete-onboarding.dto";

@Controller("users")
@UseGuards(JwtAuthGuard) // Todas las rutas requieren JWT válido
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/:id/onboarding
   * Obtiene el estado actual del onboarding del usuario.
   * Solo el propio usuario puede acceder a su información.
   */
  @Get(":id/onboarding")
  async getOnboarding(
    @Param("id") id: string,
    @CurrentUser() currentUser: { userId: string },
  ) {
    // Validación de propiedad: el usuario solo accede a sus propios datos
    if (!currentUser || currentUser.userId !== id) {
      throw new ForbiddenException("Access denied");
    }
    return this.usersService.getOnboardingStatus(id);
  }

  /**
   * PATCH /users/:id/onboarding/step
   * Actualiza el paso actual del onboarding (0-3).
   * Se usa durante el flujo de onboarding para rastrear progreso.
   */
  @Patch(":id/onboarding/step")
  async updateOnboardingStep(
    @Param("id") id: string,
    @Body() dto: UpdateOnboardingStepDto,
    @CurrentUser() currentUser: { userId: string },
  ) {
    if (!currentUser || currentUser.userId !== id) {
      throw new ForbiddenException("Access denied");
    }
    return this.usersService.updateOnboardingStep(id, dto);
  }

  /**
   * POST /users/:id/onboarding/complete
   * Marca el onboarding como completado para el usuario.
   * Una vez completado, el usuario será redirigido directamente al dashboard.
   */
  @Post(":id/onboarding/complete")
  @HttpCode(HttpStatus.OK) // Devuelve 200 en lugar de 201
  async completeOnboarding(
    @Param("id") id: string,
    @Body() _dto: CompleteOnboardingDto,
    @CurrentUser() currentUser: { userId: string },
  ) {
    if (!currentUser || currentUser.userId !== id) {
      throw new ForbiddenException("Access denied");
    }
    return this.usersService.completeOnboarding(id);
  }
}
