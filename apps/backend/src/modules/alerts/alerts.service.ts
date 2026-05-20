import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { GetAlertsDto } from "./dto/get-alerts.dto";
import { Alert, Product } from "@prisma/client";

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check stock levels and create/update alerts for a product.
   * Called automatically after stock mutations (create/update/delete/sale).
   */
  async checkAndCreateAlert(
    productId: string,
    tenantId: string,
  ): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenant_id: tenantId },
      include: { stocks: true },
    });
    if (!product) return;

    // Calculate total stock from Stock records (sum of all locations)
    const totalStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);
    const minQty = product.min_quantity ?? 0;

    // Determine alert type based on stock level
    if (totalStock <= 0) {
      // OUT_OF_STOCK alert
      const existing = await this.prisma.alert.findFirst({
        where: {
          product_id: productId,
          tenant_id: tenantId,
          type: "OUT_OF_STOCK",
          is_read: false,
        },
      });
      if (!existing) {
        await this.prisma.alert.create({
          data: {
            product_id: productId,
            type: "OUT_OF_STOCK",
            message: `"${product.name}" está sin stock (0 unidades)`,
            is_read: false,
            tenant_id: tenantId,
          },
        });
      }
    } else if (minQty > 0 && totalStock <= minQty) {
      // LOW_STOCK alert
      const existing = await this.prisma.alert.findFirst({
        where: {
          product_id: productId,
          tenant_id: tenantId,
          type: "LOW_STOCK",
          is_read: false,
        },
      });
      if (!existing) {
        await this.prisma.alert.create({
          data: {
            product_id: productId,
            type: "LOW_STOCK",
            message: `"${product.name}" tiene stock bajo (${totalStock} unidades, mínimo ${minQty})`,
            is_read: false,
            tenant_id: tenantId,
          },
        });
      }
    } else {
      // Stock is sufficient → auto-resolve any existing unread alerts for this product
      await this.prisma.alert.updateMany({
        where: { product_id: productId, tenant_id: tenantId, is_read: false },
        data: { is_read: true },
      });
    }
  }

  async findAll(dto: GetAlertsDto, user: any) {
    const where: any = { tenant_id: user.tenant_id };
    if (dto?.type) where.type = dto.type;
    if (dto?.unread) where.is_read = false;

    const page = Number(dto?.page) || 1;
    const limit = Number(dto?.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await this.prisma.alert.count({ where });
    const items = await this.prisma.alert.findMany({
      where,
      include: { product: true },
      orderBy: { created_at: "desc" },
      take: limit,
      skip,
    });

    return { items, total };
  }

  async findOne(
    id: string,
    user: any,
  ): Promise<(Alert & { product: Product | any }) | null> {
    const alert = await this.prisma.alert.findFirst({
      where: { id, tenant_id: user.tenant_id },
      include: { product: true },
    });
    if (!alert) {
      throw new NotFoundException("Alert not found");
    }
    return alert as any;
  }

  async markRead(id: string, user: any) {
    const existing = await this.prisma.alert.findFirst({
      where: { id, tenant_id: user.tenant_id },
    });
    if (!existing) {
      throw new NotFoundException("Alert not found");
    }
    return this.prisma.alert.update({ where: { id }, data: { is_read: true } });
  }

  async markAllRead(user: any) {
    const res = await this.prisma.alert.updateMany({
      where: { tenant_id: user.tenant_id, is_read: false },
      data: { is_read: true },
    });
    return { updated: true, count: res.count };
  }

  async remove(id: string, user: any) {
    const existing = await this.prisma.alert.findFirst({
      where: { id, tenant_id: user.tenant_id },
    });
    if (!existing) throw new NotFoundException("Alert not found");
    await this.prisma.alert.delete({ where: { id } });
    return { deleted: true, id };
  }

  /**
   * Scan all products for a tenant and create alerts for products with low/out of stock.
   * Used to backfill alerts when first visiting the alerts page.
   */
  async generateAlerts(tenantId: string): Promise<{ created: number }> {
    const products = await this.prisma.product.findMany({
      where: { tenant_id: tenantId },
      include: { stocks: true },
    });

    let created = 0;
    for (const product of products) {
      const totalStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);
      const minQty = product.min_quantity ?? 0;

      if (totalStock <= 0) {
        const existing = await this.prisma.alert.findFirst({
          where: {
            product_id: product.id,
            tenant_id: tenantId,
            type: "OUT_OF_STOCK",
            is_read: false,
          },
        });
        if (!existing) {
          await this.prisma.alert.create({
            data: {
              product_id: product.id,
              type: "OUT_OF_STOCK",
              message: `"${product.name}" está sin stock (0 unidades)`,
              is_read: false,
              tenant_id: tenantId,
            },
          });
          created++;
        }
      } else if (minQty > 0 && totalStock <= minQty) {
        const existing = await this.prisma.alert.findFirst({
          where: {
            product_id: product.id,
            tenant_id: tenantId,
            type: "LOW_STOCK",
            is_read: false,
          },
        });
        if (!existing) {
          await this.prisma.alert.create({
            data: {
              product_id: product.id,
              type: "LOW_STOCK",
              message: `"${product.name}" tiene stock bajo (${totalStock} unidades, mínimo ${minQty})`,
              is_read: false,
              tenant_id: tenantId,
            },
          });
          created++;
        }
      }
      // If stock is sufficient, leave existing alerts as-is (don't auto-resolve here)
    }

    return { created };
  }

  async stats(user: any) {
    const total = await this.prisma.alert.count({
      where: { tenant_id: user.tenant_id },
    });
    const unread = await this.prisma.alert.count({
      where: { tenant_id: user.tenant_id, is_read: false },
    });
    const byTypeRaw = await this.prisma.alert.groupBy({
      by: ["type"],
      where: { tenant_id: user.tenant_id },
      _count: { id: true } as any,
    });
    const byType = byTypeRaw.map((r: any) => ({
      type: r.type,
      count: (r._count as any).id,
    }));
    return { total, unread, byType };
  }
}
