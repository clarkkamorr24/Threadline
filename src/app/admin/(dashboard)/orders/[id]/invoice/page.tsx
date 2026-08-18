import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { STORE_ADDRESS_LINES, STORE_CONTACT_EMAIL, STORE_NAME } from '@/constants/store';
import { paymentMethodLabel } from '@/entities/order/model/payment';
import { PaymentMark } from '@/entities/order/ui/payment-mark';
import { PrintButton } from '@/features/admin-orders/ui/print-button';
import { isAppError } from '@/lib/errors';
import { getOrderForAdmin } from '@/services/orderService';
import { formatDateTime } from '@/utils/datetime';
import { formatMoney } from '@/utils/money';
import { requireAdmin } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Invoice · Admin',
};

export const dynamic = 'force-dynamic';

interface InvoicePageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  await requireAdmin();

  const { id } = await params;

  let order;
  try {
    order = await getOrderForAdmin(id);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const address = order.shippingAddress;
  const method = paymentMethodLabel(order.paymentMethod, order.paymentProvider);

  const totals = [
    { label: 'Subtotal', value: formatMoney(order.subtotalCents) },
    {
      label: 'Shipping',
      value: order.shippingCents === 0 ? 'Free' : formatMoney(order.shippingCents),
    },
    { label: 'Tax', value: formatMoney(order.taxCents) },
  ];

  return (
    <div className="flex flex-col items-center gap-5 print:gap-0">
      <div className="flex w-full max-w-[210mm] items-center justify-between gap-4 print:hidden">
        <Link
          href={ROUTES.admin.order(order.id)}
          className="text-brand text-sm font-semibold hover:underline"
        >
          ← Back to order
        </Link>
        <PrintButton />
      </div>

      <article className="invoice-sheet bg-background text-foreground border-line w-full max-w-[210mm] border print:border-0">
        <header
          className="bg-brand relative px-10 pt-9 pb-11 text-white"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 62%, 82% 100%, 0 100%)' }}
        >
          <div className="flex items-start justify-between gap-6">
            <div className="font-display text-[19px] leading-none font-extrabold tracking-[-0.01em]">
              {STORE_NAME.toUpperCase()}
              <span className="text-white/60">.</span>
            </div>
            <div className="text-right font-mono text-[10px] text-white/80">
              {STORE_CONTACT_EMAIL}
              {STORE_ADDRESS_LINES.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <h1 className="font-display mt-11 text-[64px] leading-[0.9] font-extrabold tracking-[-0.03em]">
            Invoice
          </h1>
        </header>

        <section className="grid gap-6 px-10 pt-8 sm:grid-cols-3">
          <div>
            <div className="text-ink-55 font-mono text-[10px] tracking-[0.08em] uppercase">
              Billed to
            </div>
            <div className="mt-1.5 text-[13px] leading-[1.5]">
              <div className="font-semibold">{order.customerName ?? address.fullName}</div>
              <div className="text-ink-70">{order.customerEmail}</div>
              <div className="text-ink-70 mt-1">
                {address.line1}
                {address.line2 ? <br /> : null}
                {address.line2}
                <br />
                {address.city}
                {address.state ? `, ${address.state}` : ''} {address.postalCode}
                <br />
                {address.country}
              </div>
            </div>
          </div>

          <div>
            <div className="text-ink-55 font-mono text-[10px] tracking-[0.08em] uppercase">
              Invoice no.
            </div>
            <div className="font-display mt-1.5 text-[15px] font-extrabold">
              #{order.orderNumber}
            </div>
            <div className="text-ink-55 mt-3 font-mono text-[10px] tracking-[0.08em] uppercase">
              Date issued
            </div>
            <div className="mt-1.5 text-[13px]">{formatDateTime(order.placedAt)}</div>
          </div>

          <div>
            <div className="text-ink-55 font-mono text-[10px] tracking-[0.08em] uppercase">
              Status
            </div>
            <div className="mt-1.5 text-[13px] font-semibold">
              {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
            </div>
            {method ? (
              <>
                <div className="text-ink-55 mt-3 font-mono text-[10px] tracking-[0.08em] uppercase">
                  Paid via
                </div>
                <div className="mt-1.5">
                  <PaymentMark
                    method={order.paymentMethod}
                    provider={order.paymentProvider}
                    height={20}
                  />
                </div>
              </>
            ) : null}
          </div>
        </section>

        <section className="px-10 pt-9">
          <div className="border-line-strong text-ink-55 flex items-end justify-between border-b pb-2.5 font-mono text-[10px] tracking-[0.08em] uppercase">
            <span>Description</span>
            <span>Cost</span>
          </div>

          <ul>
            {order.items.map((item) => {
              const variant = [item.color, item.size].filter(Boolean).join(' · ');

              return (
                <li
                  key={item.id}
                  className="border-line flex items-baseline justify-between gap-6 border-b border-dashed py-4"
                >
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium">{item.productName}</div>
                    <div className="text-ink-55 mt-1 font-mono text-[11px]">
                      {variant ? `${variant} · ` : ''}
                      {formatMoney(item.unitPriceCents)} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-[15px] font-semibold whitespace-nowrap">
                    {formatMoney(item.lineTotalCents)}
                  </div>
                </li>
              );
            })}
          </ul>

          <dl className="text-ink-70 mt-5 ml-auto flex w-full max-w-64 flex-col gap-1.5 text-[13px]">
            {totals.map((row) => (
              <div key={row.label} className="flex justify-between">
                <dt>{row.label}</dt>
                <dd className="text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-line-strong mt-4 flex items-baseline justify-between border-t pt-3.5">
            <span className="text-ink-55 font-mono text-[10px] tracking-[0.08em] uppercase">
              Total price
            </span>
            <span className="font-display text-[26px] font-extrabold tracking-[-0.02em]">
              {formatMoney(order.totalCents)}
            </span>
          </div>
        </section>

        <footer
          className="bg-brand mt-10 grid gap-6 px-10 pt-11 pb-9 text-white sm:grid-cols-3"
          style={{ clipPath: 'polygon(0 0, 18% 0, 100% 38%, 100% 100%, 0 100%)' }}
        >
          <div className="font-mono text-[10px] leading-[1.7] text-white/85">
            Thank you for shopping with {STORE_NAME}. Reach us at {STORE_CONTACT_EMAIL} for anything
            about this order.
          </div>

          <div className="font-mono text-[10px] leading-[1.7] text-white/85">
            <div className="mb-1.5 tracking-[0.08em] text-white uppercase">Payment</div>
            <PaymentMark
              method={order.paymentMethod}
              provider={order.paymentProvider}
              height={16}
              className="border-white/40 text-white"
            />
          </div>

          <div className="font-mono text-[10px] leading-[1.7] text-white/85">
            <div className="mb-1 tracking-[0.08em] text-white uppercase">Ship to</div>
            <div>{address.fullName}</div>
            <div>
              {address.city}
              {address.state ? `, ${address.state}` : ''} {address.postalCode}
            </div>
            {address.phone ? <div>{address.phone}</div> : null}
          </div>
        </footer>
      </article>
    </div>
  );
}
