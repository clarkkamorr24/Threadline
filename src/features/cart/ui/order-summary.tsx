import { Separator } from '@/components/ui/separator';
import type { CartTotals } from '@/entities/cart/model/types';
import { formatMoney } from '@/utils/money';

interface OrderSummaryProps {
  readonly totals: CartTotals;
  readonly children?: React.ReactNode;
}

export function OrderSummary({ totals, children }: OrderSummaryProps) {
  const rows = [
    { label: 'Subtotal', value: totals.subtotalCents },
    {
      label: 'Shipping',
      value: totals.shippingCents,
      display: totals.shippingCents === 0 ? 'Free' : null,
    },
    { label: 'Tax', value: totals.taxCents },
  ];

  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-6">
      <h2 className="font-semibold">Order summary</h2>

      <dl className="flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd>{row.display ?? formatMoney(row.value, totals.currency)}</dd>
          </div>
        ))}
      </dl>

      <Separator />

      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>{formatMoney(totals.totalCents, totals.currency)}</span>
      </div>

      {totals.freeShippingRemainingCents !== null ? (
        <p className="text-muted-foreground text-sm">
          Spend {formatMoney(totals.freeShippingRemainingCents, totals.currency)} more for free
          shipping.
        </p>
      ) : null}

      {children}
    </div>
  );
}
