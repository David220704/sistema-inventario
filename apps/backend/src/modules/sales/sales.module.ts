import { Module } from "@nestjs/common";
import { SalesController } from "./sales.controller";
import { PrismaModule } from "@/database/prisma.module";
import { AlertsModule } from "@/modules/alerts/alerts.module";

/**
 * SalesModule
 * Handles sales transactions and order processing. Imports PrismaModule for
 * database access and AlertsModule to generate stock-related alerts on sale events.
 */
@Module({
  imports: [PrismaModule, AlertsModule],
  controllers: [SalesController],
  providers: [],
})
export class SalesModule {}
