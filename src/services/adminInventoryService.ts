import 'server-only';
import { LOW_STOCK_THRESHOLD } from '@/constants/store';
import { db } from '@/lib/db';

export interface InventorySummary {
  readonly totalUnits: number;
  readonly inventoryValueCents: number;
  readonly lowOrOutCount: number;
}

export interface InventoryVariant {
  readonly variantId: string;
  readonly sku: string;
  readonly size: string;
  readonly color: string;
  readonly stock: number;
}

export interface InventoryProduct {
  readonly productId: string;
  readonly productName: string;
  readonly imageUrl: string | null;
  readonly totalUnits: number;
  readonly lowCount: number;
  readonly outCount: number;
  readonly variants: readonly InventoryVariant[];
}

export async function getInventorySummary(): Promise<InventorySummary> {
  const [row] = await db.$queryRaw<
    { units: bigint | null; value: bigint | null; lowcount: bigint }[]
  >`
    SELECT COALESCE(SUM(v."stock"), 0) AS units,
           COALESCE(SUM(v."stock" * COALESCE(v."priceOverrideCents", p."basePriceCents")), 0) AS value,
           COUNT(*) FILTER (WHERE v."stock" <= ${LOW_STOCK_THRESHOLD}) AS lowcount
    FROM "product_variants" v
    JOIN "products" p ON p."id" = v."productId"
    WHERE p."status" <> 'ARCHIVED'`;

  return {
    totalUnits: Number(row?.units ?? 0),
    inventoryValueCents: Number(row?.value ?? 0),
    lowOrOutCount: Number(row?.lowcount ?? 0),
  };
}

export async function listInventory(limit = 100): Promise<readonly InventoryProduct[]> {
  const rows = await db.product.findMany({
    where: { status: { not: 'ARCHIVED' } },
    select: {
      id: true,
      name: true,
      variants: {
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          stock: true,
          images: {
            select: { url: true },
            orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
            take: 1,
          },
        },
        orderBy: [{ stock: 'asc' }, { sku: 'asc' }],
      },
    },
    take: limit,
  });

  const products = rows.map((row) => {
    const variants = row.variants.map((variant) => ({
      variantId: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
    }));

    return {
      productId: row.id,
      productName: row.name,
      imageUrl: row.variants.flatMap((variant) => variant.images)[0]?.url ?? null,
      totalUnits: variants.reduce((sum, variant) => sum + variant.stock, 0),
      lowCount: variants.filter(
        (variant) => variant.stock > 0 && variant.stock <= LOW_STOCK_THRESHOLD,
      ).length,
      outCount: variants.filter((variant) => variant.stock === 0).length,
      variants,
    };
  });

  return products.sort((a, b) => {
    const urgency = b.outCount + b.lowCount - (a.outCount + a.lowCount);

    return urgency !== 0 ? urgency : a.totalUnits - b.totalUnits;
  });
}
