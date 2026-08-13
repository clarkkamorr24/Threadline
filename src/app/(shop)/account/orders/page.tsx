import Link from 'next/link';
import type { Metadata } from 'next';
import { ADMIN_ROWS_PER_PAGE } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import { OrderStatusBadge } from '@/entities/order/ui/order-status-badge';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { listOrders } from '@/services/orderService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Your orders',
};

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  readonly searchParams: Promise<{ page?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await requireUserOrRedirect(ROUTES.orders);
  const { page: rawPage } = await searchParams;

  const parsedPage = Number(rawPage);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const orders = await listOrders(user.id, page, ADMIN_ROWS_PER_PAGE);

  return (
    <div>
      <h2 className="font-display mb-4 text-[22px] font-extrabold">Order history</h2>

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
          <ul className="border-line border">
            {orders.items.map((order) => (
              <li key={order.id} className="border-line border-b last:border-b-0">
                <div className="flex flex-wrap items-center gap-4 px-5 py-5">
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base font-extrabold">
                      #{order.orderNumber}
                    </div>
                    <div className="text-ink-55 mt-1 font-mono text-[11px]">
                      {new Date(order.placedAt).toLocaleDateString('en-PH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
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

          {orders.totalPages > 1 ? (
            <nav
              aria-label="Pagination"
              className="border-line mt-6 flex items-center justify-center gap-3 border-t pt-6"
            >
              {page > 1 ? (
                <Link
                  href={`${ROUTES.orders}?page=${page - 1}`}
                  className="border-line-strong border px-4 py-2 text-[13px]"
                >
                  Previous
                </Link>
              ) : null}
              <span className="text-ink-55 font-mono text-xs">
                Page {orders.page} of {orders.totalPages}
              </span>
              {page < orders.totalPages ? (
                <Link
                  href={`${ROUTES.orders}?page=${page + 1}`}
                  className="border-line-strong border px-4 py-2 text-[13px]"
                >
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
