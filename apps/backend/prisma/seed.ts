import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ─── Helper: random integer ────────────────────────────────────────────────
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Helper: random element ────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Helper: date N days ago ───────────────────────────────────────────────
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randInt(8, 18), randInt(0, 59), randInt(0, 59));
  return d;
}

// ─── Data definitions ──────────────────────────────────────────────────────

interface CatDef {
  name: string;
  slug: string;
  description: string;
}

const categories: CatDef[] = [
  { name: "Electrónicos", slug: "electronicos", description: "Productos electrónicos y gadgets" },
  { name: "Hogar", slug: "hogar", description: "Artículos para el hogar" },
  { name: "Oficina", slug: "oficina", description: "Suministros y muebles de oficina" },
  { name: "Ropa", slug: "ropa", description: "Prendas de vestir y accesorios" },
  { name: "Alimentos", slug: "alimentos", description: "Alimentos y bebidas" },
  { name: "Ferretería", slug: "ferreteria", description: "Herramientas y artículos de ferretería" },
  { name: "Salud y Belleza", slug: "salud-belleza", description: "Productos de cuidado personal" },
];

interface ProdDef {
  name: string;
  sku: string;
  description: string;
  price: number;       // NIO
  stockQty: number;
  minQty: number;
  categorySlug: string;
}

const products: ProdDef[] = [
  // ── Electrónicos ─────────────────────────────────────────────────────────
  { name: "Audífonos Bluetooth Inalámbricos", sku: "ELE-001", description: "Audífonos over-ear con cancelación de ruido", price: 850, stockQty: 25, minQty: 5, categorySlug: "electronicos" },
  { name: "Cargador USB-C Rápido 65W", sku: "ELE-002", description: "Cargador GaN con puerto USB-C PD 65W", price: 420, stockQty: 60, minQty: 10, categorySlug: "electronicos" },
  { name: "Teclado Mecánico RGB", sku: "ELE-003", description: "Teclado mecánico switches rojos retroiluminado", price: 1200, stockQty: 4, minQty: 5, categorySlug: "electronicos" },
  { name: "Mouse Óptico Inalámbrico", sku: "ELE-004", description: "Mouse ergonómico con sensor 4000 DPI", price: 380, stockQty: 40, minQty: 8, categorySlug: "electronicos" },
  { name: "Monitor 24\" Full HD IPS", sku: "ELE-005", description: "Monitor LED 24 pulgadas 75Hz", price: 3200, stockQty: 8, minQty: 3, categorySlug: "electronicos" },
  { name: "Hub USB-C 7 en 1", sku: "ELE-006", description: "Hub multipuerto con HDMI, USB-A, SD", price: 520, stockQty: 30, minQty: 10, categorySlug: "electronicos" },
  // ── Hogar ────────────────────────────────────────────────────────────────
  { name: "Set de Sartenes Antiadherentes 3pc", sku: "HOG-001", description: "Juego de sartenes con recubrimiento cerámico", price: 950, stockQty: 3, minQty: 5, categorySlug: "hogar" },
  { name: "Organizador de Escritorio Multiusos", sku: "HOG-002", description: "Bandeja organizadora con 5 compartimentos", price: 210, stockQty: 50, minQty: 10, categorySlug: "hogar" },
  { name: "Lámpara LED de Mesa", sku: "HOG-003", description: "Lámpara con brazo ajustable y luz regulable", price: 480, stockQty: 35, minQty: 8, categorySlug: "hogar" },
  { name: "Juego de Toallas 4 piezas", sku: "HOG-004", description: "Toallas de microfibra 500g/m²", price: 360, stockQty: 45, minQty: 10, categorySlug: "hogar" },
  { name: "Cortina Blackout 1.5x2m", sku: "HOG-005", description: "Cortina opaca con argollas metálicas", price: 580, stockQty: 12, minQty: 4, categorySlug: "hogar" },
  // ── Oficina ──────────────────────────────────────────────────────────────
  { name: "Resma Papel Bond Carta 500 hojas", sku: "OFI-001", description: "Papel bond 75g/m² tamaño carta", price: 95, stockQty: 200, minQty: 20, categorySlug: "oficina" },
  { name: "Silla Ergonómica de Oficina", sku: "OFI-002", description: "Silla con soporte lumbar ajustable", price: 3500, stockQty: 5, minQty: 2, categorySlug: "oficina" },
  { name: "Marcadores Permanentes Caja 12un", sku: "OFI-003", description: "Marcadores punta fina colores surtidos", price: 130, stockQty: 80, minQty: 15, categorySlug: "oficina" },
  { name: "Archivador de Palanca Oficio", sku: "OFI-004", description: "Archivador tamaño oficio lomo ancho 8cm", price: 85, stockQty: 0, minQty: 10, categorySlug: "oficina" },
  { name: "Escritorio Compacto 120x60cm", sku: "OFI-005", description: "Escritorio con cubierta melamina", price: 2100, stockQty: 4, minQty: 2, categorySlug: "oficina" },
  // ── Ropa ─────────────────────────────────────────────────────────────────
  { name: "Camiseta Algodón Premium M/L", sku: "ROP-001", description: "Camiseta manga corta 100% algodón", price: 250, stockQty: 75, minQty: 15, categorySlug: "ropa" },
  { name: "Jeans Clásico Tela Denim", sku: "ROP-002", description: "Pantalón jeans corte recto", price: 550, stockQty: 30, minQty: 8, categorySlug: "ropa" },
  { name: "Chaqueta Impermeable", sku: "ROP-003", description: "Chaqueta con capucha y forro térmico", price: 980, stockQty: 18, minQty: 5, categorySlug: "ropa" },
  { name: "Zapatos Casual Cuero", sku: "ROP-004", description: "Zapatos de vestir suela antideslizante", price: 1200, stockQty: 10, minQty: 4, categorySlug: "ropa" },
  { name: "Gorra Deportiva Ajustable", sku: "ROP-005", description: "Gorra con protección UV", price: 140, stockQty: 60, minQty: 12, categorySlug: "ropa" },
  // ── Alimentos ────────────────────────────────────────────────────────────
  { name: "Café Molido Premium 1lb", sku: "ALI-001", description: "Café 100% arábica tostado medio", price: 180, stockQty: 90, minQty: 15, categorySlug: "alimentos" },
  { name: "Aceite Vegetal 1L", sku: "ALI-002", description: "Aceite de soya refinado", price: 55, stockQty: 120, minQty: 20, categorySlug: "alimentos" },
  { name: "Arroz Blanco 5lb", sku: "ALI-003", description: "Arroz extra largo seleccionado", price: 85, stockQty: 150, minQty: 25, categorySlug: "alimentos" },
  { name: "Frijoles Rojos 2lb", sku: "ALI-004", description: "Frijoles rojos enteros seleccionados", price: 60, stockQty: 0, minQty: 30, categorySlug: "alimentos" },
  // ── Ferretería ───────────────────────────────────────────────────────────
  { name: "Taladro Eléctrico 500W", sku: "FER-001", description: "Taladro percutor con mandril 10mm", price: 1250, stockQty: 7, minQty: 3, categorySlug: "ferreteria" },
  { name: "Caja de Herramientas 30piezas", sku: "FER-002", description: "Set de herramientas con llaves, dados y destornilladores", price: 890, stockQty: 2, minQty: 5, categorySlug: "ferreteria" },
  { name: "Cinta Métrica 5m", sku: "FER-003", description: "Cinta métrica retráctil con freno", price: 65, stockQty: 100, minQty: 15, categorySlug: "ferreteria" },
  { name: "Pintura Acrílica Blanca 1gal", sku: "FER-004", description: "Pintura acrílica lavable interior", price: 320, stockQty: 22, minQty: 6, categorySlug: "ferreteria" },
  // ── Salud y Belleza ──────────────────────────────────────────────────────
  { name: "Shampoo Reparador 400ml", sku: "SAL-001", description: "Shampoo con keratina y aceite de argán", price: 125, stockQty: 55, minQty: 10, categorySlug: "salud-belleza" },
  { name: "Protector Solar FPS 50 200ml", sku: "SAL-002", description: "Bloqueador solar resistente al agua", price: 210, stockQty: 0, minQty: 8, categorySlug: "salud-belleza" },
  { name: "Cepillo Dental Eléctrico", sku: "SAL-003", description: "Cepillo recargable con 3 cabezales", price: 340, stockQty: 28, minQty: 6, categorySlug: "salud-belleza" },
];

const warehouseLocations = [
  "Bodega Central - Estante A1",
  "Bodega Central - Estante A2",
  "Bodega Central - Estante B1",
  "Bodega Central - Estante B2",
  "Bodega Central - Estante C1",
  "Bodega Norte - Estante A1",
  "Bodega Norte - Estante A2",
  "Bodega Sur - Estante B1",
  "Bodega Sur - Estante B2",
  "Local Principal - Trastienda",
  "Local Principal - Exhibición",
  "Local Secundario - Estante 1",
];

interface SaleItemDef {
  productSku: string;
  qty: number;
}

interface SaleDef {
  daysAgo: number;
  items: SaleItemDef[];
}

// Generate 18 sales spread over the last 30 days
function generateSales(availableSkus: string[]): SaleDef[] {
  const sales: SaleDef[] = [];
  const usedDays = new Set<number>();

  for (let i = 0; i < 18; i++) {
    let day: number;
    do {
      day = randInt(0, 29);
    } while (usedDays.has(day));
    usedDays.add(day);

    const numItems = randInt(1, 4);
    const items: SaleItemDef[] = [];
    const usedSkus = new Set<string>();

    for (let j = 0; j < numItems; j++) {
      let sku: string;
      do {
        sku = pick(availableSkus);
      } while (usedSkus.has(sku));
      usedSkus.add(sku);

      items.push({
        productSku: sku,
        qty: randInt(1, 5),
      });
    }

    sales.push({ daysAgo: day, items });
  }
  return sales;
}

// ─── Main seed function ────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...");

  const tenantId = "tenant_default";

  // ── 0. Clean existing volatile data (stock, sales, alerts) ────────────
  // These lack natural unique keys, so we delete before recreating.
  console.log("\n🧹 Cleaning existing volatile data...");
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.alert.deleteMany({});
  console.log("  ✓ Stock, sales, alerts cleaned");

  // ── 1. USERS ────────────────────────────────────────────────────────────
  console.log("\n👤 Creating users...");

  const adminPassword = await bcrypt.hash("Joplin2222", 10);
  const testPassword = await bcrypt.hash("Test123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "davidandresojeda1@gmail.com" },
    update: {},
    create: {
      email: "davidandresojeda1@gmail.com",
      password: adminPassword,
      name: "David Andres Ojeda",
      role: "ADMIN",
      tenant_id: tenantId,
      onboarding_completed: true,
      onboarding_step: 3,
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  const vendedor = await prisma.user.upsert({
    where: { email: "vendedor@test.com" },
    update: {},
    create: {
      email: "vendedor@test.com",
      password: testPassword,
      name: "María García",
      role: "USER",
      tenant_id: tenantId,
      onboarding_completed: true,
      onboarding_step: 3,
    },
  });
  console.log(`  ✓ Vendedor: ${vendedor.email}`);

  const gerente = await prisma.user.upsert({
    where: { email: "gerente@test.com" },
    update: {},
    create: {
      email: "gerente@test.com",
      password: testPassword,
      name: "Carlos Mendoza",
      role: "USER",
      tenant_id: tenantId,
      onboarding_completed: true,
      onboarding_step: 3,
    },
  });
  console.log(`  ✓ Gerente: ${gerente.email}`);

  // ── 2. CATEGORIES ──────────────────────────────────────────────────────
  console.log("\n📂 Creating categories...");

  const categoryMap = new Map<string, string>(); // slug → id

  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug_tenant_id: { slug: cat.slug, tenant_id: tenantId } },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        tenant_id: tenantId,
      },
    });
    categoryMap.set(cat.slug, created.id);
    console.log(`  ✓ ${cat.name}`);
  }

  // ── 3. PRODUCTS ────────────────────────────────────────────────────────
  console.log("\n📦 Creating products...");

  const productSkuMap = new Map<string, string>(); // sku → id
  const productsWithStock: ProdDef[] = [];

  for (const prod of products) {
    const categoryId = categoryMap.get(prod.categorySlug)!;
    const created = await prisma.product.upsert({
      where: { sku_tenant_id: { sku: prod.sku, tenant_id: tenantId } },
      update: {},
      create: {
        name: prod.name,
        sku: prod.sku,
        description: prod.description,
        price: prod.price,
        stockQuantity: prod.stockQty,
        min_quantity: prod.minQty,
        category_id: categoryId,
        tenant_id: tenantId,
      },
    });
    productSkuMap.set(prod.sku, created.id);
    if (prod.stockQty > 0) {
      productsWithStock.push(prod);
    }
    console.log(`  ✓ ${prod.name} (${prod.sku}) — C$ ${prod.price.toFixed(2)}`);
  }

  // ── 4. STOCK ───────────────────────────────────────────────────────────
  console.log("\n🏭 Creating stock records...");

  // Create stock for about 2/3 of products with stock
  const stockCandidates = productsWithStock.filter(() => Math.random() > 0.3);

  // Ensure at least 10 stock records
  const stockToCreate = stockCandidates.slice(0, Math.max(10, stockCandidates.length));

  for (const prod of stockToCreate) {
    const productId = productSkuMap.get(prod.sku)!;
    const location = pick(warehouseLocations);
    const stockQty = randInt(1, Math.max(2, Math.floor(prod.stockQty / 3)));

    // Use upsert by composite — create unique stock entries; since no natural unique key
    // we simply delete + create to ensure idempotency per product+location
    // Better: just create fresh each time after clearing (idempotent via deleteMany)
    await prisma.stock.create({
      data: {
        product_id: productId,
        quantity: stockQty,
        location,
      },
    });
    console.log(`  ✓ ${prod.name} → ${location} (${stockQty} uds)`);
  }

  console.log(`  → Total: ${stockToCreate.length} stock records`);

  // ── 5. SALES + SALE ITEMS ──────────────────────────────────────────────
  console.log("\n🧾 Creating sales...");

  const availableSkus = products
    .filter((p) => p.stockQty > 0)
    .map((p) => p.sku);

  const sales = generateSales(availableSkus);
  let saleCount = 0;

  for (const saleDef of sales) {
    const saleDate = daysAgo(saleDef.daysAgo);
    let total = 0;
    const itemsData: { productId: string; qty: number; unitPrice: number }[] = [];

    for (const itemDef of saleDef.items) {
      const prod = products.find((p) => p.sku === itemDef.productSku)!;
      const unitPrice = prod.price;
      const subtotal = unitPrice * itemDef.qty;
      total += subtotal;
      itemsData.push({
        productId: productSkuMap.get(itemDef.productSku)!,
        qty: itemDef.qty,
        unitPrice,
      });
    }

    const sale = await prisma.sale.create({
      data: {
        total,
        status: Math.random() > 0.05 ? "COMPLETED" : "CANCELLED",
        tenant_id: tenantId,
        created_at: saleDate,
        updated_at: saleDate,
        items: {
          create: itemsData.map((item) => ({
            product_id: item.productId,
            quantity: item.qty,
            unit_price: item.unitPrice,
            subtotal: item.unitPrice * item.qty,
          })),
        },
      },
    });

    saleCount++;
    console.log(`  ✓ Venta #${saleCount} — C$ ${total.toFixed(2)} (${saleDef.items.length} items, ${saleDef.daysAgo}d atrás)`);
  }

  console.log(`  → Total: ${saleCount} ventas creadas`);

  // ── 6. ALERTS ──────────────────────────────────────────────────────────
  console.log("\n🔔 Creating alerts...");

  // Find products with low or zero stock
  const lowStockProducts = products.filter(
    (p) => p.stockQty > 0 && p.stockQty <= p.minQty,
  );
  const outOfStockProducts = products.filter((p) => p.stockQty === 0);

  let alertCount = 0;

  // LOW_STOCK alerts
  for (const prod of lowStockProducts) {
    const productId = productSkuMap.get(prod.sku)!;
    await prisma.alert.upsert({
      where: {
        id: `alert_low_${prod.sku}`,
      },
      update: {},
      create: {
        id: `alert_low_${prod.sku}`,
        product_id: productId,
        type: "LOW_STOCK",
        message: `Stock bajo: "${prod.name}" tiene ${prod.stockQty} unidades (mínimo: ${prod.minQty}).`,
        tenant_id: tenantId,
        is_read: Math.random() > 0.6,
      },
    });
    alertCount++;
    console.log(`  ⚠️  LOW_STOCK: ${prod.name} (${prod.stockQty}/${prod.minQty})`);
  }

  // OUT_OF_STOCK alerts
  for (const prod of outOfStockProducts) {
    const productId = productSkuMap.get(prod.sku)!;
    await prisma.alert.upsert({
      where: {
        id: `alert_out_${prod.sku}`,
      },
      update: {},
      create: {
        id: `alert_out_${prod.sku}`,
        product_id: productId,
        type: "OUT_OF_STOCK",
        message: `Sin stock: "${prod.name}" se ha agotado.`,
        tenant_id: tenantId,
        is_read: Math.random() > 0.6,
      },
    });
    alertCount++;
    console.log(`  🚫 OUT_OF_STOCK: ${prod.name}`);
  }

  console.log(`  → Total: ${alertCount} alertas creadas`);

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("✅ Seed completado exitosamente");
  console.log("═".repeat(50));
  console.log(`  Usuarios:    3`);
  console.log(`  Categorías:  ${categories.length}`);
  console.log(`  Productos:   ${products.length}`);
  console.log(`  Stocks:      ${stockToCreate.length}`);
  console.log(`  Ventas:      ${saleCount}`);
  console.log(`  Alertas:     ${alertCount}`);
  console.log("═".repeat(50));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
