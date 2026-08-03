import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { DEFAULT_PRODUCT_SORT, MAX_PAGE_SIZE, PRODUCTS_PER_PAGE } from '@/constants/catalog';
import type { ProductSort } from '@/constants/catalog';
import type {
  CategoryModel,
  Paginated,
  ProductDetail,
  ProductQuery,
  ProductSummary,
} from '@/entities/product/model/types';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';


const productSummarySelect = {
  id: true,
  name: true,
  slug: true,
  priceCents: true,
  compareAtCents: true,
  currency: true,
  stock: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, alt: true },
    orderBy: { position: 'asc' },
    take: 1,
  },
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  ...productSummarySelect,
  description: true,
  sku: true,
  images: {
    select: { id: true, url: true, alt: true },
    orderBy: { position: 'asc' },
  },
} satisfies Prisma.ProductSelect;

type ProductSummaryRow = Prisma.ProductGetPayload<{ select: typeof productSummarySelect }>;
type ProductDetailRow = Prisma.ProductGetPayload<{ select: typeof productDetailSelect }>;

function toProductSummary(row: ProductSummaryRow): ProductSummary {
  const image = row.images[0];

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    priceCents: row.priceCents,
    compareAtCents: row.compareAtCents,
    currency: row.currency,
    inStock: row.stock > 0,
    primaryImage: image ? { id: image.id, url: image.url, alt: image.alt ?? row.name } : null,
    category: row.category,
  };
}

function toProductDetail(row: ProductDetailRow): ProductDetail {
  return {
    ...toProductSummary(row),
    description: row.description,
    sku: row.sku,
    stock: row.stock,
    images: row.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt ?? row.name,
    })),
  };
}

const SORT_ORDER: Readonly<Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]>> = {
  newest: [{ createdAt: 'desc' }],
  'price-asc': [{ priceCents: 'asc' }],
  'price-desc': [{ priceCents: 'desc' }],
  'name-asc': [{ name: 'asc' }],
};

function buildWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const conditions: Prisma.ProductWhereInput[] = [
    { status: 'ACTIVE' },
  ];

  if (query.search) {
    conditions.push({
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }

  if (query.categorySlug) {
    conditions.push({ category: { slug: query.categorySlug } });
  }

  if (query.minPriceCents !== null || query.maxPriceCents !== null) {
    conditions.push({
      priceCents: {
        ...(query.minPriceCents !== null ? { gte: query.minPriceCents } : {}),
        ...(query.maxPriceCents !== null ? { lte: query.maxPriceCents } : {}),
      },
    });
  }

  if (query.inStockOnly) {
    conditions.push({ stock: { gt: 0 } });
  }

  return { AND: conditions };
}

export async function listProducts(query: ProductQuery): Promise<Paginated<ProductSummary>> {
  const pageSize = Math.min(query.pageSize, MAX_PAGE_SIZE);
  const where = buildWhere(query);
  const [rows, total] = await db.$transaction([
    db.product.findMany({
      where,
      select: productSummarySelect,
      orderBy: SORT_ORDER[query.sort],
      skip: (query.page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  return {
    items: rows.map(toProductSummary),
    total,
    page: query.page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  const row = await db.product.findFirst({
    where: { slug, status: 'ACTIVE' },
    select: productDetailSelect,
  });

  if (!row) {
    throw new NotFoundError('Product');
  }

  return toProductDetail(row);
}

export async function getFeaturedProducts(limit = 4): Promise<readonly ProductSummary[]> {
  const rows = await db.product.findMany({
    where: { status: 'ACTIVE', featured: true },
    select: productSummarySelect,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return rows.map(toProductSummary);
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<readonly ProductSummary[]> {
  const rows = await db.product.findMany({
    where: { status: 'ACTIVE', categoryId, id: { not: productId } },
    select: productSummarySelect,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return rows.map(toProductSummary);
}

export async function listCategories(): Promise<readonly CategoryModel[]> {
  const rows = await db.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      _count: { select: { products: { where: { status: 'ACTIVE' } } } },
    },
    orderBy: { name: 'asc' },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl,
    productCount: row._count.products,
  }));
}

export async function listActiveProductSlugs(): Promise<readonly string[]> {
  const rows = await db.product.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true },
  });

  return rows.map((row) => row.slug);
}

export const DEFAULT_PRODUCT_QUERY: ProductQuery = {
  search: null,
  categorySlug: null,
  minPriceCents: null,
  maxPriceCents: null,
  inStockOnly: false,
  sort: DEFAULT_PRODUCT_SORT,
  page: 1,
  pageSize: PRODUCTS_PER_PAGE,
};
