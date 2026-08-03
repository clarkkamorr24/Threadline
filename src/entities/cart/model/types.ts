export interface CartLineItem {
  readonly id: string;
  readonly productId: string;
  readonly name: string;
  readonly slug: string;
  readonly imageUrl: string | null;
  readonly unitPriceCents: number;
  readonly currency: string;
  readonly quantity: number;
  readonly availableStock: number;
  readonly lineTotalCents: number;
}

export interface CartTotals {
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly taxCents: number;
  readonly totalCents: number;
  readonly currency: string;
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
  currency: 'USD',
  freeShippingRemainingCents: null,
};
