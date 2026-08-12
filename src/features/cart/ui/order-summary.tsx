import type { CartTotals } from '@/entities/cart/model/types';
import { TAX_RATE_BASIS_POINTS } from '@/constants/catalog';
import { formatMoney } from '@/utils/money';

interface OrderSummaryProps {
  readonly totals: CartTotals;
  readonly children?: React.ReactNode;
}

export function OrderSummary({ totals, children }: OrderSummaryProps) {
  const rows = [
    { label: 'Subtotal', display: formatMoney(totals.subtotalCents) },
    {
      label: 'Shipping',
      display: totals.shippingCents === 0 ? 'Free' : formatMoney(totals.shippingCents),
    },
    {
      label: `Estimated tax (${TAX_RATE_BASIS_POINTS / 100}%)`,
      display: formatMoney(totals.taxCents),
    },
  ];

  return (
    <div className="flex flex-col">
      <h2 className="font-display mb-[18px] text-base font-extrabold">Order summary</h2>

      <dl className="text-ink-70 flex flex-col gap-[11px] text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between">
            <dt>{row.label}</dt>
            <dd className="text-foreground">{row.display}</dd>
          </div>
        ))}
      </dl>

      {totals.freeShippingRemainingCents !== null ? (
        <p className="text-ink-55 mt-3 font-mono text-[11px] tracking-[0.04em] uppercase">
          Spend {formatMoney(totals.freeShippingRemainingCents)} more for free shipping
        </p>
      ) : null}

      <div className="border-line-strong mt-[18px] flex items-baseline justify-between border-t-2 py-[18px]">
        <span className="font-display text-[19px] font-extrabold">Total</span>
        <span className="font-display text-2xl font-extrabold">
          {formatMoney(totals.totalCents)}
        </span>
      </div>

      {children}
    </div>
  );
}
