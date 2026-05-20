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
} from "@nestjs/common";
import { JwtAuthGuard } from "@/auth/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { StockService } from "./stock.service";
import { CreateStockDto } from "./dto/create-stock.dto";
import { UpdateStockDto } from "./dto/update-stock.dto";
import { GetStocksDto } from "./dto/get-stocks.dto";

/**
 * StockController
 * Manages inventory stock entries (CRUD) per product. All routes are protected
 * by JwtAuthGuard. Stock operations are tenant-scoped via the authenticated user.
 */
@Controller("stocks")
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  /**
   * Lists stock entries, optionally filtered by product_id and location.
   * @param dto - Query filters (product_id, location)
   * @param user - Current authenticated user (provides tenant_id)
   * @returns Array of stock entries
   */
  @Get()
  async getAll(@Query() dto: GetStocksDto, @CurrentUser() user: any) {
    return this.stockService.findAll(dto, user.tenant_id);
  }

  /**
   * Returns a single stock entry by ID.
   * @param id - Stock entry ID
   * @param user - Current authenticated user (provides tenant_id)
   * @returns Stock entry with associated product
   */
  @Get(":id")
  async getOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.stockService.findOne(id, user.tenant_id);
  }

  /**
   * Creates a new stock entry for a product. Validates the product belongs
   * to the current tenant and syncs the product's stockQuantity.
   * @param dto - Stock creation payload (product_id, quantity, location)
   * @param user - Current authenticated user (provides tenant_id)
   * @returns Created stock entry
   */
  @Post()
  async create(@Body() dto: CreateStockDto, @CurrentUser() user: any) {
    return this.stockService.create(dto, user.tenant_id);
  }

  /**
   * Updates an existing stock entry (quantity, location).
   * @param id - Stock entry ID
   * @param dto - Fields to update
   * @param user - Current authenticated user (provides tenant_id)
   * @returns Updated stock entry
   */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateStockDto,
    @CurrentUser() user: any,
  ) {
    return this.stockService.update(id, dto, user.tenant_id);
  }

  /**
   * Deletes a stock entry by ID.
   * @param id - Stock entry ID to delete
   * @param user - Current authenticated user (provides tenant_id)
   * @returns Deletion confirmation
   */
  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.stockService.remove(id, user.tenant_id);
  }

  /**
   * Returns all stock entries for a specific product.
   * @param productId - Product ID to filter by
   * @param user - Current authenticated user (provides tenant_id)
   * @returns Array of stock entries for the product
   */
  @Get("product/:productId")
  async getByProduct(
    @Param("productId") productId: string,
    @CurrentUser() user: any,
  ) {
    return this.stockService.findByProduct(productId, user.tenant_id);
  }
}
