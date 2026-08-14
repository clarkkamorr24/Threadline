import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { LOW_STOCK_THRESHOLD } from '@/constants/store';
import type { Paginated } from '@/entities/product/model/types';
import { db } from '@/lib/db';

export const INVENTORY_SORTS = ['name', 'stock', 'status'] as const;
export type InventorySort = (typeof INVENTORY_SORTS)[number];
export type SortDirection = 'asc' | 'desc';

export interface InventoryQuery {
  readonly search: string | null;
  readonly sort: InventorySort;
  readonly direction: SortDirection;
  readonly page: number;
  readonly pageSize: number;
}

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
  readonly matchedVariant: boolean;
  readonly variants: readonly InventoryVariant[];
}

function buildInventoryWhere(search: string | null): Prisma.ProductWhereInput {
  const base: Prisma.ProductWhereInput = { status: { not: 'ARCHIVED' } };

  if (!search) {
    return base;
  }

  const contains = { contains: search, mode: 'insensitive' } as const;

  return {
    AND: [
      base,
      {
        OR: [
          { name: contains },
          {
            variants: {
              some: { OR: [{ sku: contains }, { color: contains }, { size: contains }] },
            },
          },
        ],
      },
    ],
  };
}

function statusRank(product: {
  outCount: number;
  lowCount: number;
  variants: readonly unknown[];
}): number {
  if (product.variants.length > 0 && product.outCount === product.variants.length) {
    return 2;
  }

  return product.outCount + product.lowCount > 0 ? 1 : 0;
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

export async function listInventory(query: InventoryQuery): Promise<Paginated<InventoryProduct>> {
  const rows = await db.product.findMany({
    where: buildInventoryWhere(query.search),
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
  });

  const needle = query.search?.toLowerCase() ?? null;

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
      matchedVariant:
        needle !== null &&
        variants.some((variant) =>
          [variant.sku, variant.color, variant.size].some((field) =>
            field.toLowerCase().includes(needle),
          ),
        ),
      variants,
    };
  });

  const factor = query.direction === 'asc' ? 1 : -1;

  products.sort((a, b) => {
    if (query.sort === 'name') {
      return a.productName.localeCompare(b.productName) * factor;
    }

    if (query.sort === 'stock') {
      return (a.totalUnits - b.totalUnits) * factor;
    }

    const rank = statusRank(a) - statusRank(b);

    return (rank !== 0 ? rank : a.totalUnits - b.totalUnits) * factor;
  });

  const total = products.length;
  const start = (query.page - 1) * query.pageSize;

  return {
    items: products.slice(start, start + query.pageSize),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}
