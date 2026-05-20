import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";

/**
 * HealthController
 * Provides a simple health-check endpoint for Render and other uptime monitors.
 * The GET /health route is public (no JWT required).
 */
@Controller("health")
export class HealthController {
  /**
   * Returns a 200 OK response with status information.
   * Used by Render's health check system to verify the service is running.
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "sistema-inventario-backend",
    };
  }
}
