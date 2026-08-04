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
  readonly parentId: string | null;
  readonly productCount?: number;
}

export interface CategoryTreeNode extends CategoryModel {
  readonly children: readonly CategoryTreeNode[];
}

export interface ProductVariantModel {
  readonly id: string;
  readonly size: string | null;
  readonly color: string | null;
  readonly sku: string;
  readonly stock: number;
  readonly priceCents: number;
  readonly imageId: string | null;
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
  readonly category: Pick<CategoryModel, 'id' | 'name' | 'slug'>;
}

export interface ProductDetail extends ProductSummary {
  readonly description: string;
  readonly material: string | null;
  readonly sku: string;
  readonly basePriceCents: number;
  readonly baseStock: number;
  readonly images: readonly ProductImageModel[];
  readonly variants: readonly ProductVariantModel[];
  readonly sizes: readonly string[];
  readonly colors: readonly string[];
}

export interface AdminProductRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly sku: string;
  readonly basePriceCents: number;
  readonly totalStock: number;
  readonly variantCount: number;
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

export interface PurchasableUnit {
  readonly priceCents: number;
  readonly stock: number;
  readonly sku: string;
  readonly variantId: string | null;
  readonly size: string | null;
  readonly color: string | null;
}

export function resolvePurchasable(
  product: Pick<ProductDetail, 'basePriceCents' | 'baseStock' | 'sku'>,
  variant: ProductVariantModel | null,
): PurchasableUnit {
  if (!variant) {
    return {
      priceCents: product.basePriceCents,
      stock: product.baseStock,
      sku: product.sku,
      variantId: null,
      size: null,
      color: null,
    };
  }

  return {
    priceCents: variant.priceCents,
    stock: variant.stock,
    sku: variant.sku,
    variantId: variant.id,
    size: variant.size,
    color: variant.color,
  };
}
