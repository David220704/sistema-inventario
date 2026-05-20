import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { CreateStockDto } from "./dto/create-stock.dto";
import { UpdateStockDto } from "./dto/update-stock.dto";
import { GetStocksDto } from "./dto/get-stocks.dto";
import { AlertsService } from "@/modules/alerts/alerts.service";

/**
 * StockService
 * Implements inventory stock business logic. All queries are tenant-scoped.
 * Creates, updates, and deletes stock entries while syncing the aggregated
 * stockQuantity on the Product table and triggering alerts via AlertsService.
 */
@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * Lists all stock entries for a tenant, with optional product_id and location filters.
   * @param dto - Query filters
   * @param tenantId - Tenant ID to scope the query
   * @returns Array of stock entries with product details
   */
  async findAll(dto: GetStocksDto, tenantId: string) {
    const where: any = {
      product: { tenant_id: tenantId },
    };

    if (dto.product_id) {
      where.product_id = dto.product_id;
    }

    if (dto.location) {
      where.location = dto.location;
    }

    const stocks = await this.prisma.stock.findMany({
      where,
      include: { product: true },
      orderBy: { id: "asc" },
    });

    return stocks;
  }

  /**
   * Finds a single stock entry by ID, scoped to the tenant.
   * @param id - Stock entry ID
   * @param tenantId - Tenant ID to scope the query
   * @returns Stock entry with product details
   */
  async findOne(id: string, tenantId: string) {
    const stock = await this.prisma.stock.findFirst({
      where: { id, product: { tenant_id: tenantId } },
      include: { product: true },
    });
    if (!stock) {
      throw new NotFoundException("Stock not found");
    }
    return stock;
  }

  /**
   * Creates a new stock entry for a product within the tenant.
   * Validates product ownership, syncs product.stockQuantity, and triggers alerts.
   * @param dto - Stock creation data
   * @param tenantId - Tenant ID to scope the query
   * @returns Created stock entry with product details
   */
  async create(dto: CreateStockDto, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.product_id, tenant_id: tenantId },
    });
    if (!product) {
      throw new BadRequestException(
        "Product does not belong to the current tenant",
      );
    }

    // Create stock entry using Prisma instead of raw SQL
    const stock = await this.prisma.stock.create({
      data: {
        product: { connect: { id: dto.product_id } },
        quantity: dto.quantity,
        location: dto.location,
      } as any,
      include: { product: true },
    });

    // Sync stockQuantity on Product for quick access
    await this.prisma.$executeRaw`
      UPDATE "Product"
      SET "stockQuantity" = (
        SELECT COALESCE(SUM(quantity), 0) FROM "Stock" WHERE product_id = ${dto.product_id}
      )
      WHERE id = ${dto.product_id} AND tenant_id = ${tenantId}
    `;

    // Generate alert based on new stock level
    await this.alertsService.checkAndCreateAlert(dto.product_id, tenantId);

    return stock;
  }

  /**
   * Updates quantity and/or location of an existing stock entry.
   * Syncs product.stockQuantity and triggers alerts on change.
   * @param id - Stock entry ID
   * @param dto - Fields to update
   * @param tenantId - Tenant ID to scope the query
   * @returns Updated stock entry with product details
   */
  async update(id: string, dto: UpdateStockDto, tenantId: string) {
    const stock = await this.prisma.stock.findFirst({
      where: { id, product: { tenant_id: tenantId } },
    });
    if (!stock) {
      throw new NotFoundException("Stock not found");
    }

    const data: any = {};
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.location !== undefined) data.location = dto.location;

    if (Object.keys(data).length === 0) {
      return stock;
    }

    const updated = await this.prisma.stock.update({
      where: { id: stock.id },
      data,
      include: { product: true },
    });

    // Sync stockQuantity on Product after update
    await this.prisma.$executeRaw`
      UPDATE "Product"
      SET "stockQuantity" = (
        SELECT COALESCE(SUM(quantity), 0) FROM "Stock" WHERE product_id = ${stock.product_id}
      )
      WHERE id = ${stock.product_id} AND tenant_id = ${tenantId}
    `;

    // Generate alert based on new stock level
    await this.alertsService.checkAndCreateAlert(stock.product_id, tenantId);

    return updated;
  }

  /**
   * Deletes a stock entry and syncs the product's stockQuantity.
   * @param id - Stock entry ID to delete
   * @param tenantId - Tenant ID to scope the query
   * @returns Deletion confirmation
   */
  async remove(id: string, tenantId: string) {
    const stock = await this.prisma.stock.findFirst({
      where: { id, product: { tenant_id: tenantId } },
    });
    if (!stock) {
      throw new NotFoundException("Stock not found");
    }

    const productId = stock.product_id;

    await this.prisma.$executeRaw`DELETE FROM "Stock" WHERE id = ${stock.id}`;

    // Sync stockQuantity after deletion
    await this.prisma.$executeRaw`
      UPDATE "Product"
      SET "stockQuantity" = (
        SELECT COALESCE(SUM(quantity), 0) FROM "Stock" WHERE product_id = ${productId}
      )
      WHERE id = ${productId} AND tenant_id = ${tenantId}
    `;

    // Generate alert based on new stock level
    await this.alertsService.checkAndCreateAlert(productId, tenantId);

    return { deleted: true };
  }

  /**
   * Finds all stock entries for a given product within the tenant.
   * @param productId - Product ID to filter by
   * @param tenantId - Tenant ID to scope the query
   * @returns Array of stock entries for the product
   */
  async findByProduct(productId: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenant_id: tenantId },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const stocks = await this.prisma.stock.findMany({
      where: { product_id: productId, product: { tenant_id: tenantId } },
      include: { product: true },
    });
    return stocks;
  }
}
