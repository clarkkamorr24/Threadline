import Link from 'next/link';
import type { Metadata } from 'next';
import { ORDER_HISTORY_MAX, ORDER_HISTORY_STEP } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import { ORDER_HISTORY_TABS, resolveHistoryTab } from '@/entities/order/model/types';
import { OrderStatusBadge } from '@/entities/order/ui/order-status-badge';
import { OrderActions } from '@/features/orders/ui/order-actions';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { listOrders } from '@/services/orderService';
import { cn } from '@/lib/utils';
import { formatShortDateTime } from '@/utils/datetime';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Your orders',
};

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  readonly searchParams: Promise<{ show?: string; tab?: string }>;
}

function parseShow(value: string | undefined): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < ORDER_HISTORY_STEP) {
    return ORDER_HISTORY_STEP;
  }

  return Math.min(parsed, ORDER_HISTORY_MAX);
}

const EMPTY_COPY: Readonly<Record<string, string>> = {
  orders: 'Orders you place will appear here.',
  pending: 'No unfinished payments. Anything you start but do not pay for will wait here.',
  cancelled: 'No cancelled orders.',
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await requireUserOrRedirect(ROUTES.orders);
  const { show: rawShow, tab: rawTab } = await searchParams;

  const show = parseShow(rawShow);
  const activeTab = resolveHistoryTab(rawTab);
  const statuses = ORDER_HISTORY_TABS.find((tab) => tab.id === activeTab)?.statuses ?? [];

  const [orders, ...counts] = await Promise.all([
    listOrders(user.id, 1, show, statuses),
    ...ORDER_HISTORY_TABS.map((tab) => listOrders(user.id, 1, 1, tab.statuses)),
  ]);

  const shown = orders.items.length;
  const hasMore = shown < orders.total;
  const atCap = !hasMore && orders.total > ORDER_HISTORY_STEP;

  const hrefFor = (tabId: string): string =>
    tabId === 'orders' ? ROUTES.orders : `${ROUTES.orders}?tab=${tabId}`;

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

      <nav aria-label="Order status" className="border-line mb-5 flex gap-1 border-b">
        {ORDER_HISTORY_TABS.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const count = counts[index]?.total ?? 0;

          return (
            <Link
              key={tab.id}
              href={hrefFor(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                '-mb-px border-b-2 px-3.5 py-2.5 text-[13px] transition-colors',
                isActive
                  ? 'border-foreground text-foreground font-semibold'
                  : 'text-ink-55 hover:text-foreground border-transparent',
              )}
            >
              {tab.label}
              {count > 0 ? (
                <span className="text-ink-55 ml-1.5 font-mono text-[11px]">{count}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {orders.items.length === 0 ? (
        <div className="border-line border px-5 py-16 text-center">
          <p className="text-ink-70">{EMPTY_COPY[activeTab]}</p>
          {activeTab === 'orders' ? (
            <Link
              href={ROUTES.products}
              className="bg-primary text-primary-foreground mt-4 inline-block px-6.5 py-3 text-sm font-medium"
            >
              Start shopping
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          {activeTab === 'pending' ? (
            <p className="border-status-processing bg-status-processing/8 text-ink-70 mb-4 border px-4 py-3 text-[13px] leading-[1.6]">
              These payments were never completed, so the orders will not ship. Finish paying, or
              cancel to release the items.
            </p>
          ) : null}

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

                    <div className="flex flex-wrap items-center gap-2.5">
                      {order.status === 'PROCESSING' ? (
                        <OrderActions
                          orderId={order.id}
                          status={order.status}
                          className="border-line-strong hover:border-foreground h-auto rounded-none px-4 py-2.25 text-[13px]"
                        />
                      ) : null}

                      <Link
                        href={ROUTES.order(order.id)}
                        className="border-line-strong hover:border-foreground border px-4 py-2.25 text-[13px] transition-colors"
                      >
                        {activeTab === 'cancelled' ? 'View' : 'Track'}
                      </Link>
                    </div>
                  </div>

                  {order.status === 'PENDING' ? (
                    <div className="border-line border-t px-5 py-3.5">
                      <OrderActions orderId={order.id} status={order.status} size="sm" />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          {hasMore ? (
            <div className="mt-6 flex justify-center">
              <Link
                scroll={false}
                href={`${hrefFor(activeTab)}${activeTab === 'orders' ? '?' : '&'}show=${Math.min(
                  show + ORDER_HISTORY_STEP,
                  ORDER_HISTORY_MAX,
                )}`}
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
