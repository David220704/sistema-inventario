import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
} from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/auth/common/guards/jwt-auth.guard";
import { SettingsService } from "./settings.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { ExportDataDto } from "./dto/export-data.dto";
import { Response } from "express";

type CurrentUserPayload = {
  userId: string;
  email: string;
  tenant_id: string;
  role: string;
};

/**
 * SettingsController
 * Manages user account settings: profile updates, password changes, preferences,
 * data export, and account deletion. All routes are protected by JwtAuthGuard.
 */
@Controller("settings")
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Retrieves the authenticated user's profile (name, email).
   * @param user - Current authenticated user from JWT payload
   * @returns User profile object
   */
  @Get("profile")
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.settingsService.getProfile(user as any);
  }

  /**
   * Updates the authenticated user's profile (name, email).
   * @param dto - Profile fields to update
   * @param user - Current authenticated user from JWT payload
   * @returns Updated user profile object
   */
  @Patch("profile")
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.settingsService.updateProfile(dto, user as any);
  }

  /**
   * Changes the authenticated user's password. Requires the current password for verification.
   * @param dto - Change password payload (oldPassword, newPassword)
   * @param user - Current authenticated user from JWT payload
   * @returns Success confirmation
   */
  @Post("password")
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.settingsService.changePassword(dto, user as any);
  }

  /**
   * Retrieves the user's application preferences (theme, notifications).
   * @param user - Current authenticated user from JWT payload
   * @returns Preferences object
   */
  @Get("preferences")
  async getPreferences(@CurrentUser() user: CurrentUserPayload) {
    return this.settingsService.getPreferences(user as any);
  }

  /**
   * Updates the user's application preferences.
   * @param dto - Preferences to update (theme, notifications)
   * @param user - Current authenticated user from JWT payload
   * @returns Updated preferences object
   */
  @Patch("preferences")
  async updatePreferences(
    @Body() dto: UpdatePreferencesDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.settingsService.updatePreferences(dto, user as any);
  }

  /**
   * Exports the tenant's data (products, stocks, sales) as a downloadable JSON file.
   * @param dto - Export options
   * @param user - Current authenticated user from JWT payload
   * @param res - Express response object for file download headers
   */
  @Post("export")
  async exportData(
    @Body() dto: ExportDataDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const data = await this.settingsService.exportData(dto, user as any);
    const filename = `export-${Date.now()}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(JSON.stringify(data));
  }

  /**
   * Permanently deletes the authenticated user's account.
   * @param user - Current authenticated user from JWT payload
   * @returns Deletion confirmation
   */
  @Delete("account")
  async deleteAccount(@CurrentUser() user: CurrentUserPayload) {
    return this.settingsService.deleteAccount(user as any);
  }
}
