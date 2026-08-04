/**
 * Order domain models.
 *
 * Line items carry a snapshot of the product *and the variant* as they were at
 * purchase time — renaming a product, deleting a variant, or repricing must
 * never rewrite history on an order the customer already placed.
 */

export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_TRANSITIONS: Readonly<
  Record<OrderStatusValue, readonly OrderStatusValue[]>
> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatusValue, to: OrderStatusValue): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

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
  readonly variantId: string | null;
  readonly productName: string;
  readonly productSlug: string;
  readonly size: string | null;
  readonly color: string | null;
  readonly sku: string | null;
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

export interface AdminOrderRow extends OrderSummary {
  readonly customerEmail: string;
  readonly customerName: string | null;
}
