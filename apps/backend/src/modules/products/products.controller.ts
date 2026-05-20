import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/auth/common/guards/jwt-auth.guard";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { GetProductsDto } from "./dto/get-products.dto";
import { Product, Category, Stock } from "@prisma/client";

type CurrentUserPayload = {
  userId: string;
  email: string;
  tenant_id: string;
  role: string;
};

/**
 * Products Controller
 *
 * RESTful endpoints for product management.
 *
 * Endpoints:
 * - GET /products - List products (paginated, filterable)
 * - GET /products/:id - Get single product
 * - POST /products - Create product
 * - PATCH /products/:id - Update product
 * - DELETE /products/:id - Delete product
 *
 * All endpoints require JWT authentication.
 */
@Controller("products")
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /products
   * List products with pagination, search, and category filters.
   */
  @Get()
  async findAll(
    @Query() query: GetProductsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const { items, total } = await this.productsService.findAll(
      query,
      user as any,
    );

    // Wrap in paginated response format
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * GET /products/:id
   * Get a single product by ID.
   */
  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<any> {
    return this.productsService.findOne(id, user as any);
  }

  /**
   * POST /products
   * Create a new product.
   */
  @Post()
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<any> {
    return this.productsService.create(dto, user as any);
  }

  /**
   * PATCH /products/:id
   * Update a product (partial update).
   */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<(Product & { category: Category; stocks: Stock[] }) | null> {
    return this.productsService.update(id, dto, user as any);
  }

  /**
   * DELETE /products/:id
   * Delete a product.
   */
  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.productsService.remove(id, user as any);
  }
}
