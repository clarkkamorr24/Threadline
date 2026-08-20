'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { OrderStatusValue } from '@/entities/order/model/types';
import { canTransition } from '@/entities/order/model/types';
import { useToast } from '@/hooks/useToast';
import { cancelOrderAction, resumePaymentAction } from '../api/actions';

interface OrderActionsProps {
  readonly orderId: string;
  readonly status: OrderStatusValue;
  readonly size?: 'default' | 'sm';
}

const CANCEL_FAILURE: Readonly<Record<string, string>> = {
  'not-found': 'That order could not be found.',
  'too-late': 'This order has already shipped, so it can no longer be cancelled.',
};

export function OrderActions({ orderId, status, size = 'default' }: OrderActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<'pay' | 'cancel' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const canCancel = canTransition(status, 'CANCELLED');
  const canPay = status === 'PENDING';

  if (!canCancel && !canPay) {
    return null;
  }

  function continuePayment(): void {
    setAction('pay');

    startTransition(async () => {
      const result = await resumePaymentAction({ orderId });

      if (!result.success || !result.data.redirectUrl) {
        setAction(null);
        toast.error(
          'Could not reopen the payment',
          result.success ? 'Cancel this order and place it again.' : result.error.message,
        );
        return;
      }

      window.location.assign(result.data.redirectUrl);
    });
  }

  function cancelOrder(): void {
    setAction('cancel');

    startTransition(async () => {
      const result = await cancelOrderAction({ orderId });
      setAction(null);

      if (!result.success) {
        toast.error('Could not cancel the order', result.error.message);
        return;
      }

      if (result.data.outcome !== 'cancelled') {
        setIsConfirming(false);
        toast.error('Could not cancel the order', CANCEL_FAILURE[result.data.outcome] ?? '');
        router.refresh();
        return;
      }

      setIsConfirming(false);
      toast.success('Order cancelled', 'Any reserved stock has been released.');
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {canPay ? (
          <Button
            type="button"
            size={size}
            onClick={continuePayment}
            isLoading={isPending && action === 'pay'}
            disabled={isPending}
          >
            Continue payment
          </Button>
        ) : null}

        {canCancel ? (
          <Button
            type="button"
            size={size}
            variant="outline"
            onClick={() => setIsConfirming(true)}
            disabled={isPending}
          >
            Cancel order
          </Button>
        ) : null}
      </div>

      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              {status === 'PENDING'
                ? 'The unfinished payment will be closed and the items released. This cannot be undone.'
                : 'The order will not be shipped and the items will be released. This cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirming(false)}
              disabled={isPending}
            >
              Keep order
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={cancelOrder}
              isLoading={isPending && action === 'cancel'}
            >
              Cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PendingPaymentPanel({ orderId }: { readonly orderId: string }) {
  return (
    <div className="border-status-processing bg-status-processing/8 border p-5">
      <div className="flex items-start gap-3">
        <CircleAlert aria-hidden="true" className="text-status-processing mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <h2 className="font-display text-base font-extrabold">Payment not completed</h2>
          <p className="text-ink-70 mt-1 text-[13px] leading-[1.6]">
            We are holding these items for you, but the order will not ship until the payment goes
            through. You can finish paying, or cancel the order to release them.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <OrderActions orderId={orderId} status="PENDING" />
      </div>
    </div>
  );
}
