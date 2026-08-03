import type { ProductSort } from '@/constants/catalog';

export interface ProductImageModel {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
}

export interface CategoryModel {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly productCount?: number;
}

export interface ProductSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly priceCents: number;
  readonly compareAtCents: number | null;
  readonly currency: string;
  readonly primaryImage: ProductImageModel | null;
  readonly inStock: boolean;
  readonly category: Pick<CategoryModel, 'id' | 'name' | 'slug'>;
}

export interface ProductDetail extends ProductSummary {
  readonly description: string;
  readonly sku: string;
  readonly stock: number;
  readonly images: readonly ProductImageModel[];
}

export interface AdminProductRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly sku: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly stock: number;
  readonly status: ProductStatusValue;
  readonly featured: boolean;
  readonly categoryName: string;
  readonly primaryImageUrl: string | null;
  readonly updatedAt: string;
}

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

export interface ProductQuery {
  readonly search: string | null;
  readonly categorySlug: string | null;
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
