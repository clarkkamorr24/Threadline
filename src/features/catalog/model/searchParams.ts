import { z } from 'zod';
import { DEFAULT_PRODUCT_SORT, MAX_PAGE_SIZE, PRODUCTS_PER_PAGE } from '@/constants/catalog';
import { PRODUCT_SORT_OPTIONS } from '@/constants/catalog';
import type { ProductQuery } from '@/entities/product/model/types';
import { toCents } from '@/utils/money';


const SORT_VALUES = PRODUCT_SORT_OPTIONS.map((option) => option.value);

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const optionalPositiveNumber = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  });

const searchParamsSchema = z.object({
  q: z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed.slice(0, 100) : null;
    }),
  category: z
    .string()
    .optional()
    .transform((value) => value?.trim() || null),
  size: z
    .string()
    .optional()
    .transform((value) => value?.trim() || null),
  color: z
    .string()
    .optional()
    .transform((value) => value?.trim() || null),
  minPrice: optionalPositiveNumber,
  maxPrice: optionalPositiveNumber,
  inStock: z
    .string()
    .optional()
    .transform((value) => value === 'true' || value === '1'),
  sort: z
    .string()
    .optional()
    .transform((value) =>
      value && SORT_VALUES.includes(value as (typeof SORT_VALUES)[number])
        ? (value as ProductQuery['sort'])
        : DEFAULT_PRODUCT_SORT,
    ),
  page: z
    .string()
    .optional()
    .transform((value) => {
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
    }),
});

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseProductQuery(params: RawSearchParams): ProductQuery {
  const parsed = searchParamsSchema.parse({
    q: firstValue(params.q),
    category: firstValue(params.category),
    size: firstValue(params.size),
    color: firstValue(params.color),
    minPrice: firstValue(params.minPrice),
    maxPrice: firstValue(params.maxPrice),
    inStock: firstValue(params.inStock),
    sort: firstValue(params.sort),
    page: firstValue(params.page),
  });

  const minPriceCents = parsed.minPrice === null ? null : toCents(parsed.minPrice);
  const maxPriceCents = parsed.maxPrice === null ? null : toCents(parsed.maxPrice);

  const swap = minPriceCents !== null && maxPriceCents !== null && minPriceCents > maxPriceCents;

  return {
    search: parsed.q,
    categorySlug: parsed.category,
    size: parsed.size,
    color: parsed.color,
    minPriceCents: swap ? maxPriceCents : minPriceCents,
    maxPriceCents: swap ? minPriceCents : maxPriceCents,
    inStockOnly: parsed.inStock,
    sort: parsed.sort,
    page: parsed.page,
    pageSize: Math.min(PRODUCTS_PER_PAGE, MAX_PAGE_SIZE),
  };
}

export function buildProductSearchParams(
  query: Partial<ProductQuery> & { readonly page?: number },
): string {
  const params = new URLSearchParams();

  if (query.search) params.set('q', query.search);
  if (query.categorySlug) params.set('category', query.categorySlug);
  if (query.minPriceCents != null) params.set('minPrice', String(query.minPriceCents / 100));
  if (query.maxPriceCents != null) params.set('maxPrice', String(query.maxPriceCents / 100));
  if (query.inStockOnly) params.set('inStock', 'true');
  if (query.sort && query.sort !== DEFAULT_PRODUCT_SORT) params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}
