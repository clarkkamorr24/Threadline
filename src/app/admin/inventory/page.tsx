import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ImageOff, TriangleAlert } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constants/routes';
import { LOW_STOCK_THRESHOLD } from '@/constants/store';
import { getInventorySummary, listInventory } from '@/services/adminInventoryService';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Inventory',
};

export const dynamic = 'force-dynamic';

const BAR_CEILING = 20;

function stockState(stock: number): { label: string; className: string; bar: string } {
  if (stock === 0) {
    return {
      label: 'Out of stock',
      className: 'border-status-cancelled text-status-cancelled bg-status-cancelled/10',
      bar: 'bg-status-cancelled',
    };
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      label: 'Low stock',
      className: 'border-status-processing text-status-processing bg-status-processing/10',
      bar: 'bg-status-processing',
    };
  }

  return {
    label: 'In stock',
    className: 'border-status-delivered text-status-delivered bg-status-delivered/10',
    bar: 'bg-status-delivered',
  };
}

export default async function AdminInventoryPage() {
  const [summary, rows] = await Promise.all([getInventorySummary(), listInventory(100)]);

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
          <TriangleAlert
            aria-hidden="true"
            className="text-status-processing size-5 shrink-0"
          />
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

        {rows.length === 0 ? (
          <p className="text-ink-55 px-5 py-10 text-center text-sm">No variants yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>In stock</TableHead>
                  <TableHead className="w-[200px]">Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const state = stockState(row.stock);
                  const percent = Math.min((row.stock / BAR_CEILING) * 100, 100);

                  return (
                    <TableRow key={row.variantId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-[46px] w-[38px] shrink-0 overflow-hidden bg-[#e6e4e1]">
                            {row.imageUrl ? (
                              <Image
                                src={row.imageUrl}
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
                          <div className="min-w-0">
                            <div className="font-semibold">{row.productName}</div>
                            <div className="text-ink-55 font-mono text-[11px]">
                              {row.color} · {row.size}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-ink-70 font-mono text-xs">{row.sku}</TableCell>
                      <TableCell className="font-semibold">{row.stock}</TableCell>
                      <TableCell>
                        <div className="bg-secondary h-[7px] w-40">
                          <div className={cn('h-full', state.bar)} style={{ width: `${percent}%` }} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn('border px-2.5 py-1 text-xs whitespace-nowrap', state.className)}
                        >
                          {state.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={ROUTES.admin.editProduct(row.productId)}
                          className="border-line-strong hover:border-foreground inline-block border px-3.5 py-1.75 text-xs transition-colors"
                        >
                          Restock
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
