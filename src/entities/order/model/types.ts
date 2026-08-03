export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'FULFILLED',
  'CANCELLED',
  'REFUNDED',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export interface ShippingAddress {
  readonly fullName: string;
  readonly line1: string;
  readonly line2: string | null;
  readonly city: string;
  readonly state: string | null;
  readonly postalCode: string;
  readonly country: string;
  readonly phone: string | null;
}

export interface OrderLineItem {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly productSlug: string;
  readonly imageUrl: string | null;
  readonly unitPriceCents: number;
  readonly quantity: number;
  readonly lineTotalCents: number;
}

export interface OrderSummary {
  readonly id: string;
  readonly orderNumber: string;
  readonly status: OrderStatusValue;
  readonly totalCents: number;
  readonly currency: string;
  readonly itemCount: number;
  readonly placedAt: string;
}

export interface OrderDetail extends OrderSummary {
  readonly items: readonly OrderLineItem[];
  readonly shippingAddress: ShippingAddress;
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly taxCents: number;
}
