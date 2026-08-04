import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';
import type { OrderStatusValue } from '@/entities/order/model/types';

const STATUS_PRESENTATION: Readonly<
  Record<OrderStatusValue, { label: string; variant: BadgeProps['variant'] }>
> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  PROCESSING: { label: 'Processing', variant: 'default' },
  SHIPPED: { label: 'Shipped', variant: 'default' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
};

export function OrderStatusBadge({ status }: { readonly status: OrderStatusValue }) {
  const presentation = STATUS_PRESENTATION[status];

  return <Badge variant={presentation.variant}>{presentation.label}</Badge>;
}
