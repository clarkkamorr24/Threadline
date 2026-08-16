import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { CheckoutProgress } from '@/features/checkout/ui/checkout-progress';
import { OrderTracking } from '@/features/orders/ui/order-tracking';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { isAppError } from '@/lib/errors';
import { confirmPendingPayment, getOrderById } from '@/services/orderService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Order confirmed',
};

interface ConfirmationPageProps {
  readonly params: Promise<{ id: string }>;
}

function estimatedDelivery(placedAt: string): string {
  const from = new Date(placedAt);
  const to = new Date(placedAt);
  from.setDate(from.getDate() + 3);
  to.setDate(to.getDate() + 5);

  const month = new Intl.DateTimeFormat('en-PH', { month: 'short' });
  const day = new Intl.DateTimeFormat('en-PH', { day: 'numeric' });

  return month.format(from) === month.format(to)
    ? `${month.format(from)} ${day.format(from)}–${day.format(to)}`
    : `${month.format(from)} ${day.format(from)} – ${month.format(to)} ${day.format(to)}`;
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;
  const user = await requireUserOrRedirect(ROUTES.orderConfirmation(id));

  await confirmPendingPayment(user.id, id);

  let order;
  try {
    order = await getOrderById(user.id, id);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const isAwaitingPayment = order.status === 'PENDING';

  const cells = [
    { label: 'Order', value: `#${order.orderNumber}` },
    { label: 'Total paid', value: formatMoney(order.totalCents) },
    { label: 'Est. delivery', value: estimatedDelivery(order.placedAt) },
  ];

  return (
    <div className="mx-auto max-w-360 px-5 pt-8 lg:px-10">
      <CheckoutProgress activeIndex={4} />

      <div className="mx-auto max-w-205 pb-20 text-center">
        <div
          aria-hidden="true"
          className={
            isAwaitingPayment
              ? 'border-line-strong mx-auto grid size-18 place-items-center rounded-full border-2'
              : 'bg-brand mx-auto grid size-18 place-items-center rounded-full'
          }
        >
          {isAwaitingPayment ? (
            <span className="text-ink-55 font-mono text-xs">···</span>
          ) : (
            <Check aria-hidden="true" className="size-8.5 text-white" strokeWidth={2.4} />
          )}
        </div>

        <div className="text-brand mt-6 font-mono text-xs tracking-[0.16em] uppercase">
          {isAwaitingPayment ? 'Awaiting payment' : 'Order confirmed'}
        </div>

        <h1 className="font-display mt-3 mb-2.5 text-[34px] font-extrabold tracking-[-0.03em] md:text-[48px]">
          {isAwaitingPayment ? 'Almost there.' : 'Thank you.'}
        </h1>

        <p className="text-ink-70 text-base">
          {isAwaitingPayment ? (
            <>
              Your order <strong className="text-foreground">#{order.orderNumber}</strong> is saved
              but payment has not completed yet.
            </>
          ) : (
            <>
              Your order <strong className="text-foreground">#{order.orderNumber}</strong> is
              confirmed. A receipt is on its way to your inbox.
            </>
          )}
        </p>

        <div className="border-line-strong mt-9 border-2 text-left">
          <div className="grid sm:grid-cols-3">
            {cells.map((cell, index) => (
              <div
                key={cell.label}
                className={index < cells.length - 1 ? 'border-line sm:border-r' : undefined}
              >
                <div className="p-5.5">
                  <div className="text-ink-55 font-mono text-[11px] uppercase">{cell.label}</div>
                  <div className="font-display mt-1.5 text-lg font-extrabold">{cell.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-line border-t px-6 py-7">
            <h2 className="mb-6 text-[13px] font-semibold">Order tracking</h2>
            <OrderTracking status={order.status} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={ROUTES.order(order.id)}
            className="bg-primary text-primary-foreground px-6.5 py-3.5 text-sm font-medium"
          >
            Track your order
          </Link>
          <Link
            href={ROUTES.products}
            className="border-line-strong hover:border-foreground border px-6.5 py-3.5 text-sm font-medium transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
