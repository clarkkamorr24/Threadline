import Link from 'next/link';
import type { Metadata } from 'next';
import { ORDER_HISTORY_MAX, ORDER_HISTORY_STEP } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import { OrderStatusBadge } from '@/entities/order/ui/order-status-badge';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { listOrders } from '@/services/orderService';
import { formatShortDateTime } from '@/utils/datetime';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Your orders',
};

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  readonly searchParams: Promise<{ show?: string }>;
}

function parseShow(value: string | undefined): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < ORDER_HISTORY_STEP) {
    return ORDER_HISTORY_STEP;
  }

  return Math.min(parsed, ORDER_HISTORY_MAX);
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await requireUserOrRedirect(ROUTES.orders);
  const { show: rawShow } = await searchParams;

  const show = parseShow(rawShow);
  const orders = await listOrders(user.id, 1, show);

  const shown = orders.items.length;
  const hasMore = shown < orders.total;
  const atCap = !hasMore && orders.total > ORDER_HISTORY_STEP;

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[22px] font-extrabold">Order history</h2>
        {orders.total > 0 ? (
          <span className="text-ink-55 font-mono text-[11px]">
            {shown} of {orders.total}
          </span>
        ) : null}
      </div>

      {orders.items.length === 0 ? (
        <div className="border-line border px-5 py-16 text-center">
          <p className="text-ink-70">Orders you place will appear here.</p>
          <Link
            href={ROUTES.products}
            className="bg-primary text-primary-foreground mt-4 inline-block px-6.5 py-3 text-sm font-medium"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="border-line max-h-220 overflow-y-auto overscroll-contain border">
            <ul>
              {orders.items.map((order) => (
                <li key={order.id} className="border-line border-b last:border-b-0">
                  <div className="flex flex-wrap items-center gap-4 px-5 py-5">
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-base font-extrabold">
                        #{order.orderNumber}
                      </div>
                      <div className="text-ink-55 mt-1 font-mono text-[11px]">
                        {formatShortDateTime(order.placedAt)} · {order.itemCount} item
                        {order.itemCount === 1 ? '' : 's'}
                      </div>
                    </div>

                    <OrderStatusBadge status={order.status} />

                    <div className="w-22.5 text-right text-base font-semibold">
                      {formatMoney(order.totalCents)}
                    </div>

                    <Link
                      href={ROUTES.order(order.id)}
                      className="border-line-strong hover:border-foreground border px-4 py-2.25 text-[13px] transition-colors"
                    >
                      Track
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {hasMore ? (
            <div className="mt-6 flex justify-center">
              <Link
                scroll={false}
                href={`${ROUTES.orders}?show=${Math.min(show + ORDER_HISTORY_STEP, ORDER_HISTORY_MAX)}`}
                className="border-line-strong hover:border-foreground border px-6.5 py-3 text-sm font-medium transition-colors"
              >
                See more orders
              </Link>
            </div>
          ) : atCap ? (
            <p className="text-ink-55 mt-6 text-center font-mono text-[11px] tracking-[0.06em] uppercase">
              You have reached the bottom
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
