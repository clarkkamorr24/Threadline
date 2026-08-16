import { Check } from 'lucide-react';
import type { OrderStatusValue } from '@/entities/order/model/types';
import { cn } from '@/lib/utils';

const TRACK_STEPS = [
  { status: 'PENDING', label: 'Placed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
] as const;

interface OrderTrackingProps {
  readonly status: OrderStatusValue;
}

export function OrderTracking({ status }: OrderTrackingProps) {
  if (status === 'CANCELLED') {
    return (
      <div className="border-status-cancelled text-status-cancelled border px-4 py-3 text-sm">
        This order was cancelled.
      </div>
    );
  }

  const activeIndex = TRACK_STEPS.findIndex((step) => step.status === status);

  return (
    <ol className="flex items-start">
      {TRACK_STEPS.map((step, index) => {
        const isDone = index < activeIndex;
        const isCurrent = index === activeIndex;
        const isReached = isDone || isCurrent;

        return (
          <li key={step.status} className="relative flex-1 text-center">
            <div
              aria-hidden="true"
              className={cn(
                'mx-auto grid size-9 place-items-center rounded-full border-2',
                isReached ? 'bg-brand border-brand text-white' : 'border-line-strong text-ink-55',
              )}
            >
              {isDone ? (
                <Check className="size-4" />
              ) : (
                <span className="size-2 rounded-full bg-current" />
              )}
            </div>

            <div
              className={cn(
                'mt-2.5 text-[13px] font-semibold',
                isReached ? 'text-foreground' : 'text-ink-55',
              )}
            >
              {step.label}
            </div>

            {index < TRACK_STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-4.25 right-[calc(-50%+18px)] left-[calc(50%+18px)] h-0.5',
                  index < activeIndex ? 'bg-brand' : 'bg-line-strong',
                )}
              />
            ) : null}

            {isCurrent ? <span className="sr-only">(current status)</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
