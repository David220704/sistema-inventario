import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "@/database/prisma.module";
import { AuthModule } from "@/auth/auth.module";
import { UsersModule } from "@/users/users.module";
import { ProductsModule } from "./modules/products/products.module";
import { StockModule } from "./modules/stock/stock.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { SalesModule } from "./modules/sales/sales.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { HealthModule } from "./health/health.module";

/**
 * AppModule
 * Root module of the inventory management system.
 * Imports all feature modules (Auth, Products, Stock, Sales, Metrics, etc.)
 * and configures the global ConfigModule for environment variable access.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    StockModule,
    CategoriesModule,
    SalesModule,
    MetricsModule,
    AlertsModule,
    UploadsModule,
    SettingsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
