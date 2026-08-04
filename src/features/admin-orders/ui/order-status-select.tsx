'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ORDER_STATUS_TRANSITIONS } from '@/entities/order/model/types';
import type { OrderStatusValue } from '@/entities/order/model/types';
import { useToast } from '@/hooks/useToast';
import { updateOrderStatusAction } from '../api/actions';

interface OrderStatusSelectProps {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly status: OrderStatusValue;
}

function toLabel(status: OrderStatusValue): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function OrderStatusSelect({ orderId, orderNumber, status }: OrderStatusSelectProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const allowed = ORDER_STATUS_TRANSITIONS[status];
  const isTerminal = allowed.length === 0;

  function handleChange(next: string): void {
    if (next === status) {
      return;
    }

    startTransition(async () => {
      const result = await updateOrderStatusAction({
        orderId,
        status: next as OrderStatusValue,
      });

      if (!result.success) {
        toast.error('Could not update status', result.error.message);
        router.refresh();
        return;
      }

      toast.success('Order updated', `${orderNumber} is now ${next.toLowerCase()}`);
      router.refresh();
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isTerminal || isPending}>
      <SelectTrigger
        className="h-8 w-36"
        aria-label={`Status for order ${orderNumber}`}
        title={isTerminal ? `${toLabel(status)} is a final status` : undefined}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={status}>{toLabel(status)}</SelectItem>
        {allowed.map((value) => (
          <SelectItem key={value} value={value}>
            {toLabel(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
