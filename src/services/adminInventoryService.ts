import 'server-only';
import { LOW_STOCK_THRESHOLD } from '@/constants/store';
import { db } from '@/lib/db';

export interface InventorySummary {
  readonly totalUnits: number;
  readonly inventoryValueCents: number;
  readonly lowOrOutCount: number;
}

export interface InventoryRow {
  readonly variantId: string;
  readonly productId: string;
  readonly productName: string;
  readonly sku: string;
  readonly size: string;
  readonly color: string;
  readonly stock: number;
  readonly imageUrl: string | null;
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

export async function listInventory(limit = 100): Promise<readonly InventoryRow[]> {
  const rows = await db.productVariant.findMany({
    where: { product: { status: { not: 'ARCHIVED' } } },
    select: {
      id: true,
      productId: true,
      sku: true,
      size: true,
      color: true,
      stock: true,
      product: { select: { name: true } },
      images: {
        select: { url: true },
        orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
        take: 1,
      },
    },
    orderBy: [{ stock: 'asc' }, { sku: 'asc' }],
    take: limit,
  });

  return rows.map((row) => ({
    variantId: row.id,
    productId: row.productId,
    productName: row.product.name,
    sku: row.sku,
    size: row.size,
    color: row.color,
    stock: row.stock,
    imageUrl: row.images[0]?.url ?? null,
  }));
}
