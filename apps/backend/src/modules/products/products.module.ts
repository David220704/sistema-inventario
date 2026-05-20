import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { PrismaService } from "@/database/prisma.service";

/**
 * ProductsModule
 * Manages the product catalog — CRUD operations for products, including
 * category associations and stock tracking. All queries are tenant-scoped.
 */
@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService],
  exports: [ProductsService],
})
export class ProductsModule {}
