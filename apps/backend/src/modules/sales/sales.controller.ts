import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "@/auth/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { PrismaService } from "@/database/prisma.service";
import { AlertsService } from "@/modules/alerts/alerts.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { GetSalesDto } from "./dto/get-sales.dto";

/**
 * Sales Controller
 *
 * RESTful endpoints for sales management.
 *
 * Endpoints:
 * - POST /sales - Create a new sale
 * - GET /sales - List all sales (paginated)
 * - GET /sales/:id - Get a specific sale
 *
 * All endpoints require JWT authentication.
 */
@Controller("sales")
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * POST /sales
   * Create a new sale with items and decrement stockQuantity atomically.
   */
  @Post()
  async create(
    @Body() dto: CreateSaleDto,
    @CurrentUser() user: { tenant_id: string },
  ) {
    // Calculate total
    let total = 0;
    for (const item of dto.items) {
      total += item.quantity * item.unit_price;
    }

    // Use transaction to ensure atomicity
    const sale = await this.prisma.$transaction(async (tx) => {
      // Create sale
      const createdSale = await tx.sale.create({
        data: {
          total,
          tenant_id: user.tenant_id,
          status: "COMPLETED",
        },
      });

      // Create items and decrement stockQuantity
      for (const item of dto.items) {
        // Find stock and check quantity
        const stock = await tx.stock.findFirst({
          where: {
            product_id: item.product_id,
          },
          select: {
            id: true,
            quantity: true,
          },
        });

        if (!stock) {
          throw new BadRequestException(
            `Stock not found for product: ${item.product_id}`,
          );
        }

        const currentStock = stock.quantity ?? 0;
        if (currentStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.product_id}. Available: ${currentStock}, requested: ${item.quantity}`,
          );
        }

        // Decrement stock quantity
        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantity: { decrement: item.quantity },
            },
          });

          // Sync stockQuantity on Product
          await tx.$executeRaw`
            UPDATE "Product"
            SET "stockQuantity" = (
              SELECT COALESCE(SUM(quantity), 0) FROM "Stock" WHERE product_id = ${item.product_id}
            )
            WHERE id = ${item.product_id}
          `;
        }

        // Create sale item
        await tx.saleItem.create({
          data: {
            sale_id: createdSale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.quantity * item.unit_price,
          },
        });
      }

      return createdSale;
    });

    // Generate alerts for each product affected by the sale
    const productIds = [...new Set(dto.items.map((item) => item.product_id))];
    await Promise.all(
      productIds.map((pid) =>
        this.alertsService.checkAndCreateAlert(pid, user.tenant_id),
      ),
    );

    // Return sale with items
    return this.prisma.sale.findUnique({
      where: { id: sale.id },
      include: { items: { include: { product: true } } },
    });
  }

  /**
   * GET /sales
   * List all sales with pagination.
   * Query params: page, limit, status
   */
  @Get()
  async findAll(
    @CurrentUser() user: { tenant_id: string },
    @Query() query: GetSalesDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          tenant_id: user.tenant_id,
          ...(query.status ? { status: query.status as any } : {}),
        },
        include: { items: { include: { product: true } } },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({
        where: {
          tenant_id: user.tenant_id,
          ...(query.status ? { status: query.status as any } : {}),
        },
      }),
    ]);

    // Standard paginated response format
    return {
      items: sales,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * GET /sales/:id
   * Get a specific sale by ID.
   */
  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: { tenant_id: string },
  ) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenant_id: user.tenant_id },
      include: { items: { include: { product: true } } },
    });

    if (!sale) {
      throw new NotFoundException("Sale not found");
    }

    return sale;
  }
}
