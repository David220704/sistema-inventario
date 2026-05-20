/**
 * Categories Controller
 *
 * Endpoints para gestionar categorías de productos.
 * Todas las rutas requieren autenticación JWT.
 *
 * @module CategoriesController
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { JwtAuthGuard } from "@/auth/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { PrismaService } from "@/database/prisma.service";

@Controller("categories")
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /categories
   * Lista todas las categorías del tenant actual.
   */
  @Get()
  async findAll(@CurrentUser() user: { tenant_id: string }) {
    return this.prisma.category.findMany({
      where: { tenant_id: user.tenant_id },
      orderBy: { name: "asc" },
    });
  }

  /**
   * POST /categories/seed
   * Crea categorías de prueba para el tenant actual.
   */
  @Post("seed")
  async seed(@CurrentUser() user: { tenant_id: string }) {
    const defaultCategories = [
      { name: "Electrónicos", slug: "electronicos" },
      { name: "Ropa", slug: "ropa" },
      { name: "Hogar", slug: "hogar" },
      { name: "Alimentos", slug: "alimentos" },
      { name: "Deportes", slug: "deportes" },
      { name: "Libros", slug: "libros" },
      { name: "Juguetes", slug: "juguetes" },
      { name: "Salud", slug: "salud" },
    ];

    const created: any[] = [];

    for (const cat of defaultCategories) {
      // Verificar si ya existe
      const existing = await this.prisma.category.findFirst({
        where: { slug: cat.slug, tenant_id: user.tenant_id },
      });

      if (!existing) {
        const createdCat = await this.prisma.category.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            tenant_id: user.tenant_id,
          },
        });
        created.push(createdCat);
      }
    }

    // Obtener todas las categorías del tenant
    const allCategories = await this.prisma.category.findMany({
      where: { tenant_id: user.tenant_id },
      orderBy: { name: "asc" },
    });

    return {
      message: `Categorías disponibles: ${allCategories.length}`,
      categories: allCategories,
    };
  }

  /**
   * GET /categories/:id
   * Obtiene una categoría por ID.
   */
  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: { tenant_id: string },
  ) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenant_id: user.tenant_id },
    });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }

  /**
   * POST /categories
   * Crea una nueva categoría.
   */
  @Post()
  async create(
    @Body() body: { name: string; description?: string; slug?: string },
    @CurrentUser() user: { tenant_id: string },
  ) {
    // Verificar si ya existe una categoría con el mismo slug
    if (body.slug) {
      const existing = await this.prisma.category.findFirst({
        where: { slug: body.slug, tenant_id: user.tenant_id },
      });
      if (existing) {
        throw new ConflictException("Category with this slug already exists");
      }
    }

    return this.prisma.category.create({
      data: {
        name: body.name,
        description: body.description,
        slug: body.slug,
        tenant_id: user.tenant_id,
      },
    });
  }

  /**
   * PATCH /categories/:id
   * Actualiza una categoría.
   */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: { name?: string; description?: string; slug?: string },
    @CurrentUser() user: { tenant_id: string },
  ) {
    // Verificar propiedad
    const existing = await this.prisma.category.findFirst({
      where: { id, tenant_id: user.tenant_id },
    });
    if (!existing) {
      throw new NotFoundException("Category not found");
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        slug: body.slug,
      },
    });
  }

  /**
   * DELETE /categories/:id
   * Elimina una categoría.
   */
  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: { tenant_id: string },
  ) {
    const existing = await this.prisma.category.findFirst({
      where: { id, tenant_id: user.tenant_id },
    });
    if (!existing) {
      throw new NotFoundException("Category not found");
    }

    await this.prisma.category.delete({ where: { id } });
    return { deleted: true, id };
  }
}
