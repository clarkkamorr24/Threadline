import { cn } from '@/lib/utils';

export const CHECKOUT_STEPS = ['Cart', 'Information', 'Shipping', 'Payment', 'Complete'] as const;

interface CheckoutProgressProps {
  readonly activeIndex: number;
}

export function CheckoutProgress({ activeIndex }: CheckoutProgressProps) {
  return (
    <ol className="mb-9 flex gap-0.5 text-[11px] tracking-[0.08em] uppercase">
      {CHECKOUT_STEPS.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <li
            key={step}
            aria-current={isActive ? 'step' : undefined}
            className={cn(
              'flex-1 border-t-2 py-3',
              isActive || isDone ? 'border-foreground' : 'border-line',
            )}
          >
            <span
              className={cn(
                isActive && 'text-foreground font-semibold',
                isDone && 'text-ink-70',
                !isActive && !isDone && 'text-ink-55',
              )}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
