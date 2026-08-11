import type { ProductSort } from '@/constants/catalog';

export interface ProductImageModel {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly isPrimary: boolean;
}

export interface CategoryModel {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly productCount?: number;
}

export interface ProductVariantModel {
  readonly id: string;
  readonly size: string;
  readonly color: string;
  readonly sku: string;
  readonly stock: number;
  readonly priceCents: number;
  readonly images: readonly ProductImageModel[];
  readonly inStock: boolean;
}

export interface ProductSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly priceCents: number;
  readonly hasPriceRange: boolean;
  readonly primaryImage: ProductImageModel | null;
  readonly inStock: boolean;
  readonly categories: readonly Pick<CategoryModel, 'id' | 'name' | 'slug'>[];
}

export interface ProductDetail extends ProductSummary {
  readonly description: string;
  readonly material: string | null;
  readonly basePriceCents: number;
  readonly variants: readonly ProductVariantModel[];
  readonly sizes: readonly string[];
  readonly colors: readonly string[];
}

export interface AdminProductRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly basePriceCents: number;
  readonly totalStock: number;
  readonly variantCount: number;
  readonly status: ProductStatusValue;
  readonly featured: boolean;
  readonly categoryNames: readonly string[];
  readonly primaryImageUrl: string | null;
  readonly updatedAt: string;
}

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

export interface ProductQuery {
  readonly search: string | null;
  readonly categorySlug: string | null;
  readonly size: string | null;
  readonly color: string | null;
  readonly minPriceCents: number | null;
  readonly maxPriceCents: number | null;
  readonly inStockOnly: boolean;
  readonly sort: ProductSort;
  readonly page: number;
  readonly pageSize: number;
}

export interface Paginated<TItem> {
  readonly items: readonly TItem[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export function formatVariantLabel(
  size: string | null,
  color: string | null,
): string {
  return [size, color].filter(Boolean).join(' · ') || 'Default';
}
