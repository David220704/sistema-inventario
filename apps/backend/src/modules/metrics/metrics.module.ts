import { Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";
import { PrismaService } from "@/database/prisma.service";

/**
 * MetricsModule
 * Provides dashboard metrics and analytics endpoints. Aggregates product,
 * stock, category, and alert data for a given tenant to power the frontend
 * dashboard widgets.
 */
@Module({
  controllers: [MetricsController],
  providers: [MetricsService, PrismaService],
  exports: [MetricsService],
})
export class MetricsModule {}
