import { Module } from "@nestjs/common";
import { StockService } from "./stock.service";
import { StockController } from "./stock.controller";
import { PrismaService } from "@/database/prisma.service";
import { AlertsModule } from "@/modules/alerts/alerts.module";

/**
 * StockModule
 * Manages inventory stock levels per product. Supports CRUD operations and
 * automatically syncs stockQuantity on the Product table. Integrates with
 * AlertsModule to generate low-stock alerts when stock changes.
 */
@Module({
  imports: [AlertsModule],
  controllers: [StockController],
  providers: [StockService, PrismaService],
  exports: [StockService],
})
export class StockModule {}
