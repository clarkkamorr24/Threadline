import { STORE_CURRENCY } from '@/constants/store';

export interface CartLineItem {
  readonly id: string;
  readonly productId: string;
  readonly variantId: string | null;
  readonly name: string;
  readonly slug: string;
  readonly size: string | null;
  readonly color: string | null;
  readonly sku: string;
  readonly imageUrl: string | null;
  readonly unitPriceCents: number;
  readonly quantity: number;
  readonly availableStock: number;
  readonly lineTotalCents: number;
}

export interface CartTotals {
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly taxCents: number;
  readonly totalCents: number;
  readonly freeShippingRemainingCents: number | null;
}

export interface Cart {
  readonly id: string;
  readonly items: readonly CartLineItem[];
  readonly totals: CartTotals;
  readonly itemCount: number;
  readonly hasStockIssues: boolean;
}

export const EMPTY_CART_TOTALS: CartTotals = {
  subtotalCents: 0,
  shippingCents: 0,
  taxCents: 0,
  totalCents: 0,
  freeShippingRemainingCents: null,
};

export const EMPTY_CART: Cart = {
  id: '',
  items: [],
  totals: EMPTY_CART_TOTALS,
  itemCount: 0,
  hasStockIssues: false,
};

export function formatVariantLabel(size: string | null, color: string | null): string {
  return [size, color].filter(Boolean).join(' · ');
}

export { STORE_CURRENCY };
