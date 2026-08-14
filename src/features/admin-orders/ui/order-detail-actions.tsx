'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { ORDER_STATUS_TRANSITIONS } from '@/entities/order/model/types';
import type { OrderStatusValue } from '@/entities/order/model/types';
import { useToast } from '@/hooks/useToast';
import { updateOrderStatusAction } from '../api/actions';

interface OrderDetailActionsProps {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly status: OrderStatusValue;
}

const ADVANCE_LABELS: Partial<Record<OrderStatusValue, string>> = {
  PROCESSING: 'Mark as processing',
  SHIPPED: 'Mark as shipped',
  DELIVERED: 'Mark as delivered',
};

export function OrderDetailActions({ orderId, orderNumber, status }: OrderDetailActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const next = ORDER_STATUS_TRANSITIONS[status].find((value) => value !== 'CANCELLED') ?? null;

  function advance(): void {
    if (!next) {
      return;
    }

    startTransition(async () => {
      const result = await updateOrderStatusAction({ orderId, status: next });

      if (!result.success) {
        toast.error('Could not update status', result.error.message);
        return;
      }

      toast.success('Order updated', `${orderNumber} is now ${next.toLowerCase()}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2.5 print:hidden">
      <Button asChild variant="outline">
        <Link href={ROUTES.admin.orderInvoice(orderId)}>
          <Printer aria-hidden="true" className="size-4" />
          Print invoice
        </Link>
      </Button>

      {next ? (
        <Button type="button" onClick={advance} isLoading={isPending}>
          {ADVANCE_LABELS[next] ?? `Mark as ${next.toLowerCase()}`}
        </Button>
      ) : null}
    </div>
  );
}
