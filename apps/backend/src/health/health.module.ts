import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

/**
 * HealthModule
 * Exposes the /health endpoint for deployment health checks.
 * No dependencies on database or auth — always returns 200 if the server is running.
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
