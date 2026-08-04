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
  sku: true,
  priceCents: true,
  currency: true,
  stock: true,
  status: true,
  featured: true,
  updatedAt: true,
  category: { select: { name: true } },
  images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
} satisfies Prisma.ProductSelect;

type AdminRow = Prisma.ProductGetPayload<{ select: typeof adminRowSelect }>;

function toAdminProductRow(row: AdminRow): AdminProductRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    priceCents: row.priceCents,
    currency: row.currency,
    stock: row.stock,
    status: row.status as ProductStatusValue,
    featured: row.featured,
    categoryName: row.category.name,
    primaryImageUrl: row.images[0]?.url ?? null,
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
        { sku: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }

  if (query.status) {
    conditions.push({ status: query.status });
  }

  const where: Prisma.ProductWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  const [rows, total] = await db.$transaction([
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

/** Full product shaped for the edit form, including drafts and archived items. */
export async function getProductForEdit(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceCents: true,
      compareAtCents: true,
      currency: true,
      sku: true,
      stock: true,
      status: true,
      featured: true,
      categoryId: true,
      images: {
        select: { url: true, alt: true, storageKey: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  return product;
}

/**
 * Translates Prisma's unique-constraint error into a message naming the field
 * that actually collided, so the form can highlight it.
 */
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
  const { images, ...productData } = input;

  try {
    const created = await db.product.create({
      data: {
        ...productData,
        images: {
          createMany: {
            data: images.map((image, index) => ({ ...image, position: index })),
          },
        },
      },
      select: { id: true },
    });

    return created;
  } catch (error) {
    toConflictError(error);
  }
}

export async function updateProduct(
  id: string,
  input: ProductWriteModel,
): Promise<{ id: string }> {
  const { images, ...productData } = input;

  const existing = await db.product.findUnique({
    where: { id },
    select: { images: { select: { storageKey: true, url: true } } },
  });

  if (!existing) {
    throw new NotFoundError('Product');
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: productData });

      // Images are replaced wholesale rather than diffed. Positions are derived
      // from array order, so a reorder would otherwise need per-row updates for
      // no benefit at this scale.
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({
        data: images.map((image, index) => ({ ...image, productId: id, position: index })),
      });
    });
  } catch (error) {
    toConflictError(error);
  }

  // Assets dropped from the product are deleted from storage after the
  // transaction commits — a failed remote delete must not roll back a
  // successful database write, so it is logged rather than thrown.
  const keptKeys = new Set(images.map((image) => image.storageKey).filter(Boolean));
  const orphaned = existing.images
    .map((image) => image.storageKey)
    .filter((key): key is string => Boolean(key) && !keptKeys.has(key));

  await removeAssets(orphaned);

  return { id };
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await db.product.findUnique({
    where: { id },
    select: {
      images: { select: { storageKey: true } },
      _count: { select: { orderItems: true } },
    },
  });

  if (!existing) {
    throw new NotFoundError('Product');
  }

  // OrderItem holds a Restrict relation to preserve order history, so a product
  // that has ever sold cannot be deleted. Archiving keeps it out of the catalog
  // while leaving past orders intact.
  if (existing._count.orderItems > 0) {
    throw new ConflictError(
      'This product appears on past orders and cannot be deleted. Archive it instead.',
    );
  }

  await db.product.delete({ where: { id } });

  await removeAssets(
    existing.images.map((image) => image.storageKey).filter((key): key is string => Boolean(key)),
  );
}

/** Best-effort cleanup of provider-hosted assets. Never throws. */
async function removeAssets(keys: readonly string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  const storage = getStoragePlugin();

  await Promise.all(
    keys.map(async (key) => {
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
  const [totalProducts, activeProducts, outOfStock, totalOrders, revenue] = await db.$transaction([
    db.product.count(),
    db.product.count({ where: { status: 'ACTIVE' } }),
    db.product.count({ where: { status: 'ACTIVE', stock: 0 } }),
    db.order.count(),
    db.order.aggregate({
      where: { status: { in: ['PAID', 'FULFILLED'] } },
      _sum: { totalCents: true },
    }),
  ]);

  return {
    totalProducts,
    activeProducts,
    outOfStock,
    totalOrders,
    revenueCents: revenue._sum.totalCents ?? 0,
  };
}
