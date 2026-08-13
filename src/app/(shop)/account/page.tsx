import Link from 'next/link';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { OrderStatusBadge } from '@/entities/order/ui/order-status-badge';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { getCustomerOrderStats, listOrders } from '@/services/orderService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Account',
};

export const dynamic = 'force-dynamic';

export default async function AccountOverviewPage() {
  const user = await requireUserOrRedirect(ROUTES.account);

  const [stats, recent] = await Promise.all([
    getCustomerOrderStats(user.id),
    listOrders(user.id, 1, 3),
  ]);

  const cells = [
    { label: 'Total orders', value: String(stats.totalOrders) },
    { label: 'Total spent', value: formatMoney(stats.totalSpentCents) },
    { label: 'Avg order', value: formatMoney(stats.averageOrderCents) },
  ];

  return (
    <div>
      <div className="border-line bg-line mb-9 grid gap-px border sm:grid-cols-3">
        {cells.map((cell) => (
          <div key={cell.label} className="bg-background p-6">
            <div className="text-ink-55 font-mono text-[11px] uppercase">{cell.label}</div>
            <div className="font-display mt-2 text-[30px] font-extrabold md:text-[38px]">
              {cell.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[22px] font-extrabold">Recent orders</h2>
        <Link href={ROUTES.orders} className="text-[13px] hover:underline">
          View all →
        </Link>
      </div>

      {recent.items.length === 0 ? (
        <div className="border-line border px-5 py-16 text-center">
          <p className="text-ink-70">You have not placed an order yet.</p>
          <Link
            href={ROUTES.products}
            className="bg-primary text-primary-foreground mt-4 inline-block px-6.5 py-3 text-sm font-medium"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="border-line border">
          {recent.items.map((order) => (
            <li key={order.id} className="border-line border-b last:border-b-0">
              <Link
                href={ROUTES.order(order.id)}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[15px] font-extrabold">
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
                <div className="w-22.5 text-right text-[15px] font-semibold">
                  {formatMoney(order.totalCents)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
