import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import type { ProductSummary } from '@/entities/product/model/types';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';

export interface FavoriteItem {
  readonly id: string;
  readonly variantId: string | null;
  readonly size: string | null;
  readonly color: string | null;
  readonly product: ProductSummary;
  readonly addedAt: string;
}

const favoriteInclude = {
  variant: { select: { id: true, size: true, color: true, stock: true } },
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      basePriceCents: true,
      categories: { select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } },
      variants: {
        select: {
          id: true,
          color: true,
          stock: true,
          priceOverrideCents: true,
          images: {
            select: { id: true, url: true, alt: true, isPrimary: true },
            orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
            take: 1,
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  },
} satisfies Prisma.FavoriteInclude;

export async function listFavorites(userId: string): Promise<readonly FavoriteItem[]> {
  const rows = await db.favorite.findMany({
    where: { userId },
    include: favoriteInclude,
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((row) => {
    const image = row.product.variants.flatMap((variant) => variant.images)[0];
    const variantPrices = row.product.variants.map(
      (variant) => variant.priceOverrideCents ?? row.product.basePriceCents,
    );

    const priceCents =
      variantPrices.length > 0 ? Math.min(...variantPrices) : row.product.basePriceCents;
    const inStock = row.product.variants.some((variant) => variant.stock > 0);

    return {
      id: row.id,
      variantId: row.variantId,
      size: row.variant?.size ?? null,
      color: row.variant?.color ?? null,
      addedAt: row.createdAt.toISOString(),
      product: {
        id: row.product.id,
        name: row.product.name,
        slug: row.product.slug,
        priceCents,
        hasPriceRange:
          variantPrices.length > 0 && Math.min(...variantPrices) !== Math.max(...variantPrices),
        inStock,
        primaryImage: image
          ? {
              id: image.id,
              url: image.url,
              alt: image.alt ?? row.product.name,
              isPrimary: image.isPrimary,
            }
          : null,
        categories: row.product.categories,
        colors: [...new Set(row.product.variants.map((variant) => variant.color))],
        defaultVariantId:
          row.product.variants.find((variant) => variant.stock > 0)?.id ?? null,
      },
    };
  });
}

export async function listFavoriteProductIds(userId: string): Promise<ReadonlySet<string>> {
  const rows = await db.favorite.findMany({ where: { userId }, select: { productId: true } });
  return new Set(rows.map((row) => row.productId));
}

export async function isFavorited(
  userId: string,
  productId: string,
  variantId: string | null,
): Promise<boolean> {
  const existing = await db.favorite.findFirst({
    where: { userId, productId, variantId },
    select: { id: true },
  });

  return existing !== null;
}

export async function toggleFavorite(
  userId: string,
  productId: string,
  variantId: string | null,
): Promise<{ readonly isFavorited: boolean }> {
  const product = await db.product.findFirst({
    where: { id: productId, status: 'ACTIVE' },
    select: { id: true },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  if (variantId) {
    const variant = await db.productVariant.findFirst({
      where: { id: variantId, productId },
      select: { id: true },
    });

    if (!variant) {
      throw new NotFoundError('Variant');
    }
  }

  const existing = await db.favorite.findFirst({
    where: { userId, productId, variantId },
    select: { id: true },
  });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return { isFavorited: false };
  }

  await db.favorite.create({ data: { userId, productId, variantId } });
  return { isFavorited: true };
}

export async function countFavorites(userId: string): Promise<number> {
  return db.favorite.count({ where: { userId } });
}
