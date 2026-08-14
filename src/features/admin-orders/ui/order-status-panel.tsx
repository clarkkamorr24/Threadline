'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
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

interface OrderStatusPanelProps {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly status: OrderStatusValue;
}

export function toStatusLabel(status: OrderStatusValue): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function OrderStatusPanel({ orderId, orderNumber, status }: OrderStatusPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<OrderStatusValue>(status);
  const [isPending, startTransition] = useTransition();

  const allowed = ORDER_STATUS_TRANSITIONS[status];
  const isTerminal = allowed.length === 0;
  const isDirty = selected !== status;

  function save(): void {
    if (!isDirty) {
      return;
    }

    startTransition(async () => {
      const result = await updateOrderStatusAction({ orderId, status: selected });

      if (!result.success) {
        toast.error('Could not update status', result.error.message);
        setSelected(status);
        return;
      }

      toast.success('Order updated', `${orderNumber} is now ${selected.toLowerCase()}`);
      router.refresh();
    });
  }

  return (
    <div className="border-line bg-card border p-5">
      <h2 className="font-display mb-3.5 text-base font-extrabold">Update status</h2>

      {isTerminal ? (
        <p className="text-ink-55 text-[13px] leading-[1.5]">
          {toStatusLabel(status)} is a final status, so this order can no longer be moved.
        </p>
      ) : (
        <>
          <Select
            value={selected}
            onValueChange={(next) => setSelected(next as OrderStatusValue)}
            disabled={isPending}
          >
            <SelectTrigger className="w-full" aria-label={`Status for order ${orderNumber}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={status}>{toStatusLabel(status)}</SelectItem>
              {allowed.map((value) => (
                <SelectItem key={value} value={value}>
                  {toStatusLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            className="mt-3 w-full justify-center"
            onClick={save}
            disabled={!isDirty}
            isLoading={isPending}
          >
            Save
          </Button>
        </>
      )}
    </div>
  );
}
