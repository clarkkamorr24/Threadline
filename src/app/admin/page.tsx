import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ImageOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { OrderStatusBadge } from '@/entities/order/ui/order-status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getMonthlyRevenue, getTopProducts } from '@/services/adminDashboardService';
import { getCatalogStats } from '@/services/adminProductService';
import { listAllOrders } from '@/services/orderService';
import { getUserStats } from '@/services/userService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export const dynamic = 'force-dynamic';

function deltaLabel(current: number, previous: number): { text: string; positive: boolean } | null {
  if (previous === 0) {
    return current > 0 ? { text: 'new this month', positive: true } : null;
  }

  const change = Math.round(((current - previous) / previous) * 100);
  return { text: `${change >= 0 ? '+' : ''}${change}% vs last month`, positive: change >= 0 };
}

export default async function AdminDashboardPage() {
  const [catalog, users, revenue, topProducts, recentOrders] = await Promise.all([
    getCatalogStats(),
    getUserStats(),
    getMonthlyRevenue(12),
    getTopProducts(5),
    listAllOrders({ status: null, search: null, page: 1, pageSize: 6 }),
  ]);

  const thisMonth = revenue.at(-1)?.revenueCents ?? 0;
  const lastMonth = revenue.at(-2)?.revenueCents ?? 0;
  const averageOrderCents =
    catalog.totalOrders > 0 ? Math.round(catalog.revenueCents / catalog.totalOrders) : 0;

  const metrics = [
    { label: 'Revenue', value: formatMoney(catalog.revenueCents), delta: deltaLabel(thisMonth, lastMonth) },
    { label: 'Orders', value: String(catalog.totalOrders), delta: null },
    { label: 'Avg order value', value: formatMoney(averageOrderCents), delta: null },
    {
      label: 'Customers',
      value: String(users.totalUsers),
      delta:
        users.newThisMonth > 0
          ? { text: `+${users.newThisMonth} this month`, positive: true }
          : null,
    },
  ];

  const peak = Math.max(...revenue.map((point) => point.revenueCents), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-line bg-line grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-background p-5.5">
            <div className="text-ink-55 font-mono text-[11px] tracking-[0.06em] uppercase">
              {metric.label}
            </div>
            <div className="font-display mt-2.5 text-[28px] font-extrabold tracking-[-0.02em] lg:text-[34px]">
              {metric.value}
            </div>
            {metric.delta ? (
              <div
                className={
                  metric.delta.positive
                    ? 'text-status-delivered mt-1.5 text-xs'
                    : 'text-status-cancelled mt-1.5 text-xs'
                }
              >
                {metric.delta.text}
              </div>
            ) : (
              <div className="text-ink-55 mt-1.5 text-xs">all time</div>
            )}
          </div>
        ))}
      </div>

      <div className="border-line bg-line grid gap-px border lg:grid-cols-[1.55fr_1fr]">
        <section className="bg-background p-6">
          <div className="mb-5.5 flex items-baseline justify-between">
            <h2 className="font-display text-base font-extrabold">Revenue</h2>
            <span className="text-ink-55 font-mono text-xs">Last 12 months</span>
          </div>

          <div className="flex h-50 items-end gap-2">
            {revenue.map((point, index) => (
              <div
                key={point.month}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                title={`${point.label}: ${formatMoney(point.revenueCents)}`}
              >
                <div
                  className={index === revenue.length - 1 ? 'bg-brand w-full' : 'bg-ink/70 w-full'}
                  style={{ height: `${Math.max((point.revenueCents / peak) * 100, 1)}%` }}
                />
                <span className="text-ink-55 font-mono text-[9px]">{point.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-background p-6">
          <h2 className="font-display mb-4.5 text-base font-extrabold">Top products</h2>

          {topProducts.length === 0 ? (
            <p className="text-ink-55 text-sm">No sales yet.</p>
          ) : (
            <ol className="flex flex-col">
              {topProducts.map((product, index) => (
                <li
                  key={product.productId}
                  className="border-line flex items-center gap-3 border-b py-2.25 last:border-b-0"
                >
                  <span className="text-ink-55 w-4 font-mono text-xs">{index + 1}</span>
                  <div className="relative h-[46px] w-[38px] shrink-0 overflow-hidden bg-[#e6e4e1]">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt=""
                        fill
                        sizes="38px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-ink-55 grid h-full place-items-center">
                        <ImageOff aria-hidden="true" className="size-3" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] leading-tight font-semibold">
                      {product.name}
                    </div>
                    <div className="text-ink-55 mt-0.5 font-mono text-[11px]">
                      {product.soldQuantity} sold
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold whitespace-nowrap">
                    {formatMoney(product.revenueCents)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="border-line border">
        <div className="border-line-strong flex items-center justify-between border-b-2 px-5 py-4">
          <h2 className="font-display text-base font-extrabold">Recent orders</h2>
          <Link href={ROUTES.admin.orders} className="text-[13px] hover:underline">
            View all →
          </Link>
        </div>

        {recentOrders.items.length === 0 ? (
          <p className="text-ink-55 px-5 py-10 text-center text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-semibold">
                      <Link href={ROUTES.admin.order(order.id)} className="hover:underline">
                        #{order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{order.customerName ?? order.customerEmail}</TableCell>
                    <TableCell className="text-ink-70 font-mono text-xs">
                      {new Date(order.placedAt).toLocaleDateString('en-PH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatMoney(order.totalCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
