/**
 * DTO para actualizar el paso de onboarding
 *
 * Valida que el paso sea un número entero entre 0 y 3.
 * - 0: Bienvenida
 * - 1: Tour del dashboard
 * - 2: Configuración
 * - 3: Completado
 *
 * @module UpdateOnboardingStepDto
 */

import { IsInt, Min, Max } from "class-validator";

export class UpdateOnboardingStepDto {
  @IsInt()
  @Min(0)
  @Max(3)
  step!: number;
}
