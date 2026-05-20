import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { GetProductsDto } from "./dto/get-products.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Listar productos con filtros y paginación
   */
  async findAll(
    params: GetProductsDto,
    user: any,
  ): Promise<{ items: any[]; total: number }> {
    const where: any = { tenant_id: user.tenant_id };
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params?.category) {
      const catVal = params.category;
      if (catVal.includes("-")) {
        where.category_id = catVal;
      } else {
        where.category = { slug: catVal };
      }
    }
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count with same filters
    const total = await this.prisma.product.count({ where });

    const items = await this.prisma.product.findMany({
      where,
      include: { category: true, stocks: true },
      take: limit,
      skip,
      orderBy: { id: "asc" },
    });

    return { items, total } as any;
  }

  /**
   * Obtener un producto por id y tenant
   */
  async findOne(id: string, user: any): Promise<any> {
    const product = await this.prisma.product.findFirst({
      where: { id, tenant_id: user.tenant_id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product as any;
  }

  /**
   * Genera un SKU automáticamente con formato: SKU-XXXX
   */
  private async generateSku(user: any): Promise<string> {
    const count = await this.prisma.product.count({
      where: { tenant_id: user.tenant_id },
    });
    const nextNum = count + 1;
    return `SKU-${nextNum.toString().padStart(4, "0")}`;
  }

  /**
   * Crear producto
   */
  async create(dto: CreateProductDto, user: any): Promise<any> {
    const sku = dto.sku?.trim() || (await this.generateSku(user));

    const data: any = {
      name: dto.name,
      sku,
      description: dto.description,
      price: dto.price,
      stockQuantity: dto.initialStock ?? 0,
      min_quantity: dto.min_quantity ?? 0,
      image_url: dto.image_url,
      category_id: dto.category_id,

      tenant_id: user.tenant_id,
    };
    const product = await this.prisma.product.create({
      data,
      include: { category: true },
    });
    return product as any;
  }

  /**
   * Actualizar producto
   */
  async update(id: string, dto: UpdateProductDto, user: any): Promise<any> {
    // Handle stockQuantity update separately if provided
    if (dto.stockQuantity !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE "Product"
        SET stockQuantity = ${dto.stockQuantity}
        WHERE id = ${id} AND tenant_id = ${user.tenant_id}
      `;
    }

    const updateData: any = { ...dto };
    if (updateData.category_id === undefined) delete updateData.category_id;
    if (updateData.name === undefined) delete updateData.name;
    if (updateData.sku === undefined) delete updateData.sku;
    if (updateData.description === undefined) delete updateData.description;
    if (updateData.price === undefined) delete updateData.price;
    if (updateData.min_quantity === undefined) delete updateData.min_quantity;
    if (updateData.stockQuantity !== undefined) delete updateData.stockQuantity;
    if (updateData.image_url === undefined) delete updateData.image_url;

    const affected = await this.prisma.product.updateMany({
      where: { id, tenant_id: user.tenant_id },
      data: updateData,
    });
    if (affected.count === 0) throw new NotFoundException("Product not found");
    const updated = await this.prisma.product.findFirst({
      where: { id, tenant_id: user.tenant_id },
      include: { category: true },
    });
    return updated as any;
  }

  /**
   * Eliminar producto
   */
  async remove(
    id: string,
    user: any,
  ): Promise<{ deleted: boolean; id: string }> {
    const existing = await this.prisma.product.findFirst({
      where: { id, tenant_id: user.tenant_id },
    });
    if (!existing) throw new NotFoundException("Product not found");
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true, id };
  }
}
