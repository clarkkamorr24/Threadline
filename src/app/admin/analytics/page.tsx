import type { Metadata } from 'next';
import {
  getMonthlyRevenue,
  getRevenueByCategory,
  getRevenueByPaymentMethod,
} from '@/services/adminDashboardService';
import { getCatalogStats } from '@/services/adminProductService';
import { getInventorySummary } from '@/services/adminInventoryService';
import { PercentBar } from '@/widgets/admin/percent-bar';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Analytics',
};

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const [catalog, revenue, byCategory, byPayment, inventory] = await Promise.all([
    getCatalogStats(),
    getMonthlyRevenue(12),
    getRevenueByCategory(),
    getRevenueByPaymentMethod(),
    getInventorySummary(),
  ]);

  const averageOrderCents =
    catalog.totalOrders > 0 ? Math.round(catalog.revenueCents / catalog.totalOrders) : 0;

  const metrics = [
    { label: 'Total revenue', value: formatMoney(catalog.revenueCents), hint: 'excludes cancelled' },
    { label: 'Orders', value: String(catalog.totalOrders), hint: 'all time' },
    { label: 'Avg order value', value: formatMoney(averageOrderCents), hint: 'revenue / orders' },
    {
      label: 'Inventory value',
      value: formatMoney(inventory.inventoryValueCents),
      hint: `${inventory.totalUnits} units on hand`,
    },
  ];

  const peak = Math.max(...revenue.map((point) => point.revenueCents), 1);
  const categoryPeak = Math.max(...byCategory.map((slice) => slice.revenueCents), 1);
  const paymentTotal = byPayment.reduce((sum, slice) => sum + slice.revenueCents, 0) || 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="border-line bg-line grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-background p-5.5">
            <div className="text-ink-55 font-mono text-[11px] uppercase">{metric.label}</div>
            <div className="font-display mt-2 text-[26px] font-extrabold lg:text-[30px]">
              {metric.value}
            </div>
            <div className="text-ink-55 mt-1 text-xs">{metric.hint}</div>
          </div>
        ))}
      </div>

      <section className="border-line bg-background border p-6">
        <div className="mb-5.5 flex items-baseline justify-between">
          <h2 className="font-display text-base font-extrabold">Revenue trend</h2>
          <span className="text-ink-55 font-mono text-xs">Monthly · last 12</span>
        </div>

        <div className="flex h-55 items-end gap-2.5">
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

      <div className="border-line bg-line grid gap-px border lg:grid-cols-2">
        <section className="bg-background p-6">
          <h2 className="font-display mb-1 text-base font-extrabold">Revenue by payment method</h2>
          <p className="text-ink-55 mb-4.5 text-xs">
            The design shows traffic sources here; this app collects no traffic data.
          </p>

          {byPayment.length === 0 ? (
            <p className="text-ink-55 text-sm">No orders yet.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {byPayment.map((slice) => (
                <PercentBar
                  key={slice.label}
                  label={slice.label}
                  value={`${formatMoney(slice.revenueCents)} · ${Math.round((slice.revenueCents / paymentTotal) * 100)}%`}
                  percent={(slice.revenueCents / paymentTotal) * 100}
                  accent
                />
              ))}
            </div>
          )}
        </section>

        <section className="bg-background p-6">
          <h2 className="font-display mb-1 text-base font-extrabold">Revenue by category</h2>
          <p className="text-ink-55 mb-4.5 text-xs">
            Products in several categories count toward each, so these may exceed total revenue.
          </p>

          {byCategory.length === 0 ? (
            <p className="text-ink-55 text-sm">No sales yet.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {byCategory.map((slice) => (
                <PercentBar
                  key={slice.label}
                  label={slice.label}
                  value={formatMoney(slice.revenueCents)}
                  percent={(slice.revenueCents / categoryPeak) * 100}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
