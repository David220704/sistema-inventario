import {
  Controller,
  Get,
  UseGuards,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtAuthGuard } from "@/auth/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { MetricsService } from "./metrics.service";

/**
 * Metrics Controller
 *
 * Dashboard KPIs and analytics endpoints.
 *
 * Endpoints:
 * - GET /metrics/dashboard - Get dashboard metrics (products, categories, stock, alerts)
 *
 * All endpoints require JWT authentication.
 */
@Controller("metrics")
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * GET /metrics/dashboard
   * Returns dashboard KPIs: total products, categories, stock, low stock alerts, etc.
   */
  @Get("dashboard")
  async getDashboard(@CurrentUser() user: any) {
    const tenantId = user?.tenantId ?? user?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException("Tenant information not found in token");
    }
    try {
      return await this.metricsService.getDashboardMetrics(tenantId);
    } catch (error) {
      // Throw 500 for server errors (not 400)
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard metrics",
      );
    }
  }
}
