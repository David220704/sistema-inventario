import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdatePreferencesDto } from "./dto/update-preferences.dto";
import { ExportDataDto } from "./dto/export-data.dto";
import * as bcrypt from "bcrypt";

/**
 * SettingsService
 * Implements business logic for user account management. All data access is
 * tenant-scoped via the authenticated user's tenant_id. Handles profile CRUD,
 * password changes, data export, and account deletion.
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds a Prisma where clause scoped by user ID and tenant_id.
   * @param user - Authenticated user payload
   * @returns Prisma where filter object
   */
  private getUserQuery(user: any) {
    return { id: user.userId, tenant_id: user.tenant_id };
  }

  /**
   * Retrieves the authenticated user's profile (name, email).
   * @param user - Authenticated user payload
   * @returns User profile object
   */
  async getProfile(user: any) {
    const found = await this.prisma.user.findFirst({
      where: { id: user.userId, tenant_id: user.tenant_id },
    });
    if (!found) throw new NotFoundException("User not found");
    const { id, name, email } = found;
    return { id, name, email };
  }

  /**
   * Updates the authenticated user's profile fields.
   * @param dto - Profile fields to update
   * @param user - Authenticated user payload
   * @returns Updated user profile object
   */
  async updateProfile(dto: UpdateProfileDto, user: any) {
    try {
      const updated = await this.prisma.user.update({
        where: { id: user.userId, tenant_id: user.tenant_id } as any,
        data: {
          name: dto.name ?? undefined,
          email: dto.email ?? undefined,
        },
      });
      const { id, name, email } = updated;
      return { id, name, email };
    } catch (e) {
      // Likely email unique constraint violation
      throw new BadRequestException(
        "Unable to update profile. The provided data might be invalid or already in use.",
      );
    }
  }

  /**
   * Changes the user's password after verifying the current password.
   * @param dto - Change password payload (oldPassword, newPassword)
   * @param user - Authenticated user payload
   * @returns Success confirmation
   */
  async changePassword(dto: ChangePasswordDto, user: any) {
    const existing = await this.prisma.user.findFirst({
      where: { id: user.userId, tenant_id: user.tenant_id },
    });
    if (!existing) throw new NotFoundException("User not found");
    const valid = await bcrypt.compare(dto.oldPassword, existing.password);
    if (!valid) throw new UnauthorizedException("Invalid password");
    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.userId, tenant_id: user.tenant_id } as any,
      data: { password: hash },
    });
    return { success: true };
  }

  /**
   * Returns the user's saved preferences (theme, notifications).
   * Currently returns defaults as preferences are not persisted in the schema.
   * @param user - Authenticated user payload
   * @returns Preferences object
   */
  async getPreferences(user: any) {
    // Preferences are not persisted in the current schema. Return defaults.
    return { theme: "light", notifications: true };
  }

  /**
   * Updates and returns the user's preferences. Currently echoes back validated
   * values without persisting.
   * @param dto - Preferences to update
   * @param user - Authenticated user payload
   * @returns Updated preferences object
   */
  async updatePreferences(dto: UpdatePreferencesDto, user: any) {
    // In a real implementation this would persist preferences.
    // For now, acknowledge and echo back validated values.
    const updated = {
      theme: dto.theme ?? "light",
      notifications: dto.notifications ?? true,
    };
    return updated;
  }

  /**
   * Exports all tenant data (products, stocks, sales) as a JSON-serializable object.
   * @param dto - Export options
   * @param user - Authenticated user payload
   * @returns Object containing all tenant data
   */
  async exportData(dto: ExportDataDto, user: any) {
    const tenantId = user.tenant_id;
    const products = await this.prisma.product.findMany({
      where: { tenant_id: tenantId },
      include: { category: true, stocks: true },
    });
    const stocks = await this.prisma.stock.findMany({
      where: {
        product: { tenant_id: tenantId },
      },
    });
    const sales = await this.prisma.sale.findMany({
      where: { tenant_id: tenantId },
    });
    return { products, stocks, sales };
  }

  /**
   * Permanently deletes the authenticated user's account using a transaction.
   * @param user - Authenticated user payload
   * @returns Deletion confirmation
   */
  async deleteAccount(user: any) {
    // Use a transaction to ensure atomicity if future related deletions are added
    const tx = this.prisma.$transaction(async (tx) => {
      // Soft delete would require a column; perform hard delete for now
      await tx.user.delete({ where: { id: user.userId } as any });
      return { deleted: true, id: user.userId };
    });
    return tx;
  }
}
