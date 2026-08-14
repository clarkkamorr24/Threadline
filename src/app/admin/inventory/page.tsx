import type { Metadata } from 'next';
import { TriangleAlert } from 'lucide-react';
import { LOW_STOCK_THRESHOLD } from '@/constants/store';
import { InventoryTable } from '@/features/admin-inventory/ui/inventory-table';
import { getInventorySummary, listInventory } from '@/services/adminInventoryService';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Inventory',
};

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const [summary, products] = await Promise.all([getInventorySummary(), listInventory(100)]);

  const cells = [
    { label: 'Total units in stock', value: String(summary.totalUnits), warn: false },
    { label: 'Inventory value', value: formatMoney(summary.inventoryValueCents), warn: false },
    { label: 'Low / out of stock', value: String(summary.lowOrOutCount), warn: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="border-line bg-line grid gap-px border sm:grid-cols-3">
        {cells.map((cell) => (
          <div key={cell.label} className="bg-background p-5.5">
            <div className="text-ink-55 font-mono text-[11px] uppercase">{cell.label}</div>
            <div
              className={cn(
                'font-display mt-2 text-[28px] font-extrabold lg:text-[34px]',
                cell.warn && summary.lowOrOutCount > 0 && 'text-status-processing',
              )}
            >
              {cell.value}
            </div>
          </div>
        ))}
      </div>

      {summary.lowOrOutCount > 0 ? (
        <div className="border-status-processing bg-status-processing/8 flex items-center gap-3 border px-5 py-4">
          <TriangleAlert aria-hidden="true" className="text-status-processing size-5 shrink-0" />
          <span className="text-sm">
            {summary.lowOrOutCount} variant{summary.lowOrOutCount === 1 ? '' : 's'} at or below{' '}
            {LOW_STOCK_THRESHOLD} units — restock soon.
          </span>
        </div>
      ) : null}

      <section className="border-line border">
        <div className="border-line-strong border-b-2 px-5 py-4">
          <h2 className="font-display text-base font-extrabold">Stock levels</h2>
        </div>

        {products.length === 0 ? (
          <p className="text-ink-55 px-5 py-10 text-center text-sm">No products yet.</p>
        ) : (
          <InventoryTable products={products} />
        )}
      </section>
    </div>
  );
}
