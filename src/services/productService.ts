import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { DEFAULT_PRODUCT_SORT, MAX_PAGE_SIZE, PRODUCTS_PER_PAGE } from '@/constants/catalog';
import type { ProductSort } from '@/constants/catalog';
import type {
  CategoryModel,
  CategoryTreeNode,
  Paginated,
  ProductDetail,
  ProductQuery,
  ProductSummary,
  ProductVariantModel,
} from '@/entities/product/model/types';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';

const variantSelect = {
  id: true,
  size: true,
  color: true,
  sku: true,
  stock: true,
  priceOverrideCents: true,
  imageId: true,
} satisfies Prisma.ProductVariantSelect;

const productSummarySelect = {
  id: true,
  name: true,
  slug: true,
  basePriceCents: true,
  baseStock: true,
  sku: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, alt: true, isPrimary: true },
    orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
    take: 1,
  },
  variants: { select: variantSelect },
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  ...productSummarySelect,
  description: true,
  material: true,
  images: {
    select: { id: true, url: true, alt: true, isPrimary: true },
    orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
  },
  variants: { select: variantSelect, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ProductSelect;

type ProductSummaryRow = Prisma.ProductGetPayload<{ select: typeof productSummarySelect }>;
type ProductDetailRow = Prisma.ProductGetPayload<{ select: typeof productDetailSelect }>;
type VariantRow = Prisma.ProductVariantGetPayload<{ select: typeof variantSelect }>;

function toVariant(row: VariantRow, basePriceCents: number): ProductVariantModel {
  const priceCents = row.priceOverrideCents ?? basePriceCents;

  return {
    id: row.id,
    size: row.size,
    color: row.color,
    sku: row.sku,
    stock: row.stock,
    priceCents,
    imageId: row.imageId,
    inStock: row.stock > 0,
  };
}

function toProductSummary(row: ProductSummaryRow): ProductSummary {
  const image = row.images[0];
  const variants = row.variants.map((variant) => toVariant(variant, row.basePriceCents));
  const prices = variants.map((variant) => variant.priceCents);
  const priceCents = prices.length > 0 ? Math.min(...prices) : row.basePriceCents;
  const hasPriceRange = prices.length > 0 && Math.min(...prices) !== Math.max(...prices);
  const inStock =
    variants.length > 0 ? variants.some((variant) => variant.inStock) : row.baseStock > 0;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    priceCents,
    hasPriceRange,
    inStock,
    primaryImage: image
      ? { id: image.id, url: image.url, alt: image.alt ?? row.name, isPrimary: image.isPrimary }
      : null,
    category: row.category,
  };
}

function distinct(values: readonly (string | null)[]): readonly string[] {
  return [...new Set(values.filter((value): value is string => value !== null))];
}

function toProductDetail(row: ProductDetailRow): ProductDetail {
  const variants = row.variants.map((variant) => toVariant(variant, row.basePriceCents));

  return {
    ...toProductSummary(row),
    description: row.description,
    material: row.material,
    sku: row.sku,
    basePriceCents: row.basePriceCents,
    baseStock: row.baseStock,
    images: row.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt ?? row.name,
      isPrimary: image.isPrimary,
    })),
    variants,
    sizes: distinct(variants.map((variant) => variant.size)),
    colors: distinct(variants.map((variant) => variant.color)),
  };
}

const SORT_ORDER: Readonly<Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]>> = {
  newest: [{ createdAt: 'desc' }],
  'price-asc': [{ basePriceCents: 'asc' }],
  'price-desc': [{ basePriceCents: 'desc' }],
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
        { material: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }

  if (query.categorySlug) {
    conditions.push({
      OR: [
        { category: { slug: query.categorySlug } },
        { category: { parent: { slug: query.categorySlug } } },
      ],
    });
  }

  if (query.size) {
    conditions.push({ variants: { some: { size: query.size } } });
  }

  if (query.color) {
    conditions.push({ variants: { some: { color: query.color } } });
  }

  if (query.minPriceCents !== null || query.maxPriceCents !== null) {
    conditions.push({
      basePriceCents: {
        ...(query.minPriceCents !== null ? { gte: query.minPriceCents } : {}),
        ...(query.maxPriceCents !== null ? { lte: query.maxPriceCents } : {}),
      },
    });
  }

  if (query.inStockOnly) {
    conditions.push({
      OR: [{ variants: { some: { stock: { gt: 0 } } } }, { variants: { none: {} }, baseStock: { gt: 0 } }],
    });
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

export async function getFeaturedProducts(limit = 8): Promise<readonly ProductSummary[]> {
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

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  parentId: true,
  _count: { select: { products: { where: { status: 'ACTIVE' } } } },
} satisfies Prisma.CategorySelect;

function toCategory(
  row: Prisma.CategoryGetPayload<{ select: typeof categorySelect }>,
): CategoryModel {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl,
    parentId: row.parentId,
    productCount: row._count.products,
  };
}

export async function listCategories(): Promise<readonly CategoryModel[]> {
  const rows = await db.category.findMany({
    select: categorySelect,
    orderBy: { name: 'asc' },
  });

  return rows.map(toCategory);
}

export async function listCategoryTree(): Promise<readonly CategoryTreeNode[]> {
  const categories = await listCategories();
  const childrenByParent = new Map<string, CategoryModel[]>();

  for (const category of categories) {
    if (category.parentId === null) {
      continue;
    }
    const siblings = childrenByParent.get(category.parentId) ?? [];
    siblings.push(category);
    childrenByParent.set(category.parentId, siblings);
  }

  const toNode = (category: CategoryModel): CategoryTreeNode => ({
    ...category,
    children: (childrenByParent.get(category.id) ?? []).map(toNode),
  });

  return categories.filter((category) => category.parentId === null).map(toNode);
}

export async function listVariantFacets(): Promise<{
  readonly sizes: readonly string[];
  readonly colors: readonly string[];
}> {
  const variants = await db.productVariant.findMany({
    where: { product: { status: 'ACTIVE' } },
    select: { size: true, color: true },
  });

  return {
    sizes: [...distinct(variants.map((variant) => variant.size))].sort(),
    colors: [...distinct(variants.map((variant) => variant.color))].sort(),
  };
}

export const DEFAULT_PRODUCT_QUERY: ProductQuery = {
  search: null,
  categorySlug: null,
  size: null,
  color: null,
  minPriceCents: null,
  maxPriceCents: null,
  inStockOnly: false,
  sort: DEFAULT_PRODUCT_SORT,
  page: 1,
  pageSize: PRODUCTS_PER_PAGE,
};
