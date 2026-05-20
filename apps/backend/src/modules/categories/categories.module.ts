/**
 * Categories Module
 *
 * Módulo de NestJS para gestionar categorías de productos.
 * Expone endpoints CRUD para categorías.
 *
 * @module CategoriesModule
 */

import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { PrismaModule } from "@/database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController],
})
export class CategoriesModule {}
