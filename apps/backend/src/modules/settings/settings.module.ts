import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { PrismaService } from "@/database/prisma.service";

/**
 * SettingsModule
 * Manages user account settings and preferences, including profile updates,
 * password changes, data export, and account deletion.
 */
@Module({
  controllers: [SettingsController],
  providers: [SettingsService, PrismaService],
  exports: [SettingsService],
})
export class SettingsModule {}
