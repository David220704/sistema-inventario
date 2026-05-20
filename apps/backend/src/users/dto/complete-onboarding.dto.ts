/**
 * DTO para marcar onboarding como completado
 *
 * Este DTO está preparado para recibir un cuerpo en la petición,
 * aunque actualmente no se usa el body (el flag se marca directamente).
 *
 * @module CompleteOnboardingDto
 */

import { IsBoolean } from "class-validator";

export class CompleteOnboardingDto {
  @IsBoolean()
  completed!: boolean;
}
