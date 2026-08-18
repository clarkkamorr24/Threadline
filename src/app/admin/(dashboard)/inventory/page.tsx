import type { Metadata } from 'next';
import { TriangleAlert } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { LOW_STOCK_THRESHOLD } from '@/constants/store';
import { InventoryTable } from '@/features/admin-inventory/ui/inventory-table';
import { parseAdminListQuery, type AdminListParams } from '@/features/admin-table/model/query';
import { AdminPagination } from '@/features/admin-table/ui/admin-pagination';
import { AdminSearch } from '@/features/admin-table/ui/admin-search';
import {
  INVENTORY_SORTS,
  getInventorySummary,
  listInventory,
} from '@/services/adminInventoryService';
import type { InventorySort, SortDirection } from '@/services/adminInventoryService';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/money';
import { requireAdmin } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Inventory',
};

export const dynamic = 'force-dynamic';

interface AdminInventoryPageProps {
  readonly searchParams: Promise<AdminListParams & { sort?: string; dir?: string }>;
}

function parseSort(value: string | undefined): InventorySort {
  return value && (INVENTORY_SORTS as readonly string[]).includes(value)
    ? (value as InventorySort)
    : 'status';
}

function parseDirection(value: string | undefined): SortDirection {
  return value === 'asc' ? 'asc' : 'desc';
}

export default async function AdminInventoryPage({ searchParams }: AdminInventoryPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const listQuery = parseAdminListQuery(params);
  const sort = parseSort(params.sort);
  const direction = parseDirection(params.dir);

  const [summary, result] = await Promise.all([
    getInventorySummary(),
    listInventory({ ...listQuery, sort, direction }),
  ]);

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

      <AdminSearch
        basePath={ROUTES.admin.inventory}
        params={params}
        placeholder="Search by product, SKU, colour or size…"
        label="Search inventory"
      />

      <section className="border-line border">
        <div className="border-line-strong border-b-2 px-5 py-4">
          <h2 className="font-display text-base font-extrabold">Stock levels</h2>
        </div>

        {result.items.length === 0 ? (
          <p className="text-ink-55 px-5 py-10 text-center text-sm">
            {listQuery.search ? `Nothing matches “${listQuery.search}”.` : 'No products yet.'}
          </p>
        ) : (
          <InventoryTable
            products={result.items}
            params={params}
            sort={sort}
            direction={direction}
          />
        )}
      </section>

      <AdminPagination
        basePath={ROUTES.admin.inventory}
        params={params}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        totalPages={result.totalPages}
        noun="products"
      />
    </div>
  );
}
