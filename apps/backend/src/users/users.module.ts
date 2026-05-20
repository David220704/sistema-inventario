/**
 * Users Module
 *
 * Módulo de NestJS que agrupa el controller y service de usuarios.
 * Se importa en AppModule para exponer los endpoints de onboarding.
 *
 * @module UsersModule
 */

import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Expuesto para uso en otros módulos si es necesario
})
export class UsersModule {}
