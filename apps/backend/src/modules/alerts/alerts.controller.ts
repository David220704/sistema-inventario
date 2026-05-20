import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { JwtAuthGuard } from "@/auth/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AlertsService } from "./alerts.service";
import { GetAlertsDto } from "./dto/get-alerts.dto";
import { Alert } from "@prisma/client";

type CurrentUserPayload = {
  userId: string;
  email: string;
  tenant_id: string;
  role: string;
};

@Controller("alerts")
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * GET /alerts
   * List alerts with pagination and optional filters
   */
  @Get()
  async findAll(
    @Query() dto: GetAlertsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const { items, total } = await this.alertsService.findAll(dto, user);

    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * GET /alerts/:id
   * Get a single alert with product details
   */
  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<(Alert & { product: any }) | null> {
    return this.alertsService.findOne(id, user);
  }

  /**
   * PATCH /alerts/:id/read
   * Mark an alert as read
   */
  @Patch(":id/read")
  async markRead(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.alertsService.markRead(id, user);
  }

  /**
   * POST /alerts/read-all
   * Mark all alerts as read for the tenant
   */
  @Post("read-all")
  async markAllRead(@CurrentUser() user: CurrentUserPayload) {
    return this.alertsService.markAllRead(user);
  }

  /**
   * DELETE /alerts/:id
   * Dismiss/delete an alert
   */
  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.alertsService.remove(id, user);
  }

  /**
   * GET /alerts/stats
   * Get alert counts
   */
  @Get("stats")
  async stats(@CurrentUser() user: CurrentUserPayload) {
    return this.alertsService.stats(user);
  }

  /**
   * POST /alerts/generate
   * Scan all products and create missing alerts for low/out of stock products.
   */
  @Post("generate")
  async generate(@CurrentUser() user: CurrentUserPayload) {
    return this.alertsService.generateAlerts(user.tenant_id);
  }
}
