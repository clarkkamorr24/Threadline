import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import type { AdminProductRow, Paginated, ProductStatusValue } from '@/entities/product/model/types';
import type { ProductWriteModel } from '@/features/admin-products/model/schema';
import { db } from '@/lib/db';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { getStoragePlugin } from '@/lib/plugins/storage/registry';

const adminRowSelect = {
  id: true,
  name: true,
  slug: true,
  basePriceCents: true,
  status: true,
  featured: true,
  updatedAt: true,
  categories: { select: { name: true }, orderBy: { name: 'asc' } },
  variants: {
    select: {
      stock: true,
      images: {
        select: { url: true },
        orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
        take: 1,
      },
    },
    orderBy: { position: 'asc' },
  },
} satisfies Prisma.ProductSelect;

type AdminRow = Prisma.ProductGetPayload<{ select: typeof adminRowSelect }>;

function toAdminProductRow(row: AdminRow): AdminProductRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    basePriceCents: row.basePriceCents,
    totalStock: row.variants.reduce((sum, variant) => sum + variant.stock, 0),
    variantCount: row.variants.length,
    status: row.status as ProductStatusValue,
    featured: row.featured,
    categoryNames: row.categories.map((category) => category.name),
    primaryImageUrl: row.variants.flatMap((variant) => variant.images)[0]?.url ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface AdminProductQuery {
  readonly search: string | null;
  readonly status: ProductStatusValue | null;
  readonly page: number;
  readonly pageSize: number;
}

export async function listAdminProducts(
  query: AdminProductQuery,
): Promise<Paginated<AdminProductRow>> {
  const conditions: Prisma.ProductWhereInput[] = [];

  if (query.search) {
    conditions.push({
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: query.search, mode: 'insensitive' } } } },
      ],
    });
  }

  if (query.status) {
    conditions.push({ status: query.status });
  }

  const where: Prisma.ProductWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      select: adminRowSelect,
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.product.count({ where }),
  ]);

  return {
    items: rows.map(toAdminProductRow),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getProductForEdit(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      basePriceCents: true,
      material: true,
      status: true,
      featured: true,
      categories: { select: { id: true } },
      variants: {
        select: {
          id: true,
          size: true,
          color: true,
          sku: true,
          stock: true,
          priceOverrideCents: true,
          images: {
            select: { id: true, url: true, alt: true, storageKey: true },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  return product;
}

function toConflictError(error: unknown): never {
  const target =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
      ? ((error as { meta?: { target?: string[] } }).meta?.target ?? [])
      : null;

  if (target) {
    const field = target.includes('sku') ? 'SKU' : target.includes('slug') ? 'slug' : 'value';
    throw new ConflictError(`That ${field} is already in use.`);
  }

  throw error;
}

export async function createProduct(input: ProductWriteModel): Promise<{ id: string }> {
  const { variants, categoryIds, ...productData } = input;

  try {
    const created = await db.product.create({
      data: {
        ...productData,
        categories: { connect: categoryIds.map((id) => ({ id })) },
      },
      select: { id: true },
    });

    for (const [index, variant] of variants.entries()) {
      await db.productVariant.create({
        data: {
          productId: created.id,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          stock: variant.stock,
          priceOverrideCents: variant.priceOverrideCents,
          position: index,
          images: {
            createMany: {
              data: variant.images.map((image, imageIndex) => ({
                url: image.url,
                alt: image.alt,
                storageKey: image.storageKey,
                position: imageIndex,
                isPrimary: imageIndex === 0,
              })),
            },
          },
        },
      });
    }

    return created;
  } catch (error) {
    toConflictError(error);
  }
}

export async function updateProduct(
  id: string,
  input: ProductWriteModel,
): Promise<{ id: string }> {
  const { variants, categoryIds, ...productData } = input;

  const existing = await db.product.findUnique({
    where: { id },
    select: { variants: { select: { images: { select: { storageKey: true } } } } },
  });

  if (!existing) {
    throw new NotFoundError('Product');
  }

  const previousKeys = existing.variants
    .flatMap((variant) => variant.images)
    .map((image) => image.storageKey)
    .filter((key): key is string => Boolean(key));

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...productData,
          categories: { set: categoryIds.map((categoryId) => ({ id: categoryId })) },
        },
      });
      await tx.productVariant.deleteMany({ where: { productId: id } });

      for (const [index, variant] of variants.entries()) {
        await tx.productVariant.create({
          data: {
            productId: id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku,
            stock: variant.stock,
            priceOverrideCents: variant.priceOverrideCents,
            position: index,
            images: {
              createMany: {
                data: variant.images.map((image, imageIndex) => ({
                  url: image.url,
                  alt: image.alt,
                  storageKey: image.storageKey,
                  position: imageIndex,
                  isPrimary: imageIndex === 0,
                })),
              },
            },
          },
        });
      }
    });
  } catch (error) {
    toConflictError(error);
  }

  const keptKeys = new Set(
    variants.flatMap((variant) => variant.images.map((image) => image.storageKey)).filter(Boolean),
  );

  await removeAssets(previousKeys.filter((key) => !keptKeys.has(key)));

  return { id };
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await db.product.findUnique({
    where: { id },
    select: {
      variants: { select: { images: { select: { storageKey: true } } } },
      _count: { select: { orderItems: true } },
    },
  });

  if (!existing) {
    throw new NotFoundError('Product');
  }

  if (existing._count.orderItems > 0) {
    throw new ConflictError(
      'This product appears on past orders and cannot be deleted. Archive it instead.',
    );
  }

  await db.product.delete({ where: { id } });

  await removeAssets(
    existing.variants
      .flatMap((variant) => variant.images)
      .map((image) => image.storageKey)
      .filter((key): key is string => Boolean(key)),
  );
}

async function removeAssets(keys: readonly string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  const stillReferenced = new Set(
    (
      await db.productImage.findMany({
        where: { storageKey: { in: [...keys] } },
        select: { storageKey: true },
        distinct: ['storageKey'],
      })
    ).map((image) => image.storageKey),
  );

  const orphaned = keys.filter((key) => !stillReferenced.has(key));

  if (orphaned.length === 0) {
    return;
  }

  const storage = getStoragePlugin();

  await Promise.all(
    orphaned.map(async (key) => {
      try {
        await storage.remove(key);
      } catch (error) {
        console.error(`[adminProductService] Could not remove asset "${key}":`, error);
      }
    }),
  );
}

export interface CatalogStats {
  readonly totalProducts: number;
  readonly activeProducts: number;
  readonly outOfStock: number;
  readonly totalOrders: number;
  readonly revenueCents: number;
}

export async function getCatalogStats(): Promise<CatalogStats> {
  const [totalProducts, activeProducts, outOfStock, totalOrders, revenue] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: 'ACTIVE' } }),
    db.product.count({
      where: {
        status: 'ACTIVE',
        NOT: { variants: { some: { stock: { gt: 0 } } } },
      },
    }),
    db.order.count(),
    db.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { totalCents: true },
    }),
  ]);

  return {
    totalProducts,
    activeProducts,
    outOfStock,
    totalOrders,
    revenueCents: revenue._sum?.totalCents ?? 0,
  };
}
