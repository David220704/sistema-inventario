import { Module } from "@nestjs/common";
import { AlertsController } from "./alerts.controller";
import { AlertsService } from "./alerts.service";
import { PrismaModule } from "@/database/prisma.module";

/**
 * AlertsModule
 * Manages inventory alerts (low stock, out-of-stock notifications).
 * Imports PrismaModule for database access and exports AlertsService
 * so that StockModule and other modules can trigger alert creation.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
