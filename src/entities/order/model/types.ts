export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const REVENUE_ORDER_STATUSES = ['PROCESSING', 'SHIPPED', 'DELIVERED'] as const;


export const ADMIN_VISIBLE_ORDER_STATUSES = [
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
] as const;

export const ORDER_HISTORY_TABS = [
  { id: 'orders', label: 'Orders', statuses: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
  { id: 'pending', label: 'Pending', statuses: ['PENDING'] },
  { id: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
] as const satisfies readonly {
  readonly id: string;
  readonly label: string;
  readonly statuses: readonly OrderStatusValue[];
}[];

export type OrderHistoryTabId = (typeof ORDER_HISTORY_TABS)[number]['id'];

export function resolveHistoryTab(value: string | undefined): OrderHistoryTabId {
  const match = ORDER_HISTORY_TABS.find((tab) => tab.id === value?.trim().toLowerCase());

  return match?.id ?? 'orders';
}

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

export interface AdminOrderDetail extends OrderDetail {
  readonly customerName: string | null;
  readonly customerEmail: string;
  readonly customerAvatarUrl: string | null;
  readonly paymentProvider: string | null;
  readonly paymentMethod: string | null;
  readonly paymentReference: string | null;
}

export interface AdminOrderRow extends OrderSummary {
  readonly customerEmail: string;
  readonly customerName: string | null;
  readonly paymentProvider: string | null;
  readonly paymentMethod: string | null;
}
