'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import { ChevronRight, ImageOff } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { InventoryProduct } from '@/services/adminInventoryService';

const BAR_CEILING = 20;

interface StockState {
  readonly label: string;
  readonly className: string;
  readonly bar: string;
}

function stockState(stock: number): StockState {
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

function productState(product: InventoryProduct): StockState {
  if (product.variants.length > 0 && product.outCount === product.variants.length) {
    return stockState(0);
  }

  if (product.outCount > 0 || product.lowCount > 0) {
    return stockState(LOW_STOCK_THRESHOLD);
  }

  return stockState(LOW_STOCK_THRESHOLD + 1);
}

function StockBar({ percent, bar }: { readonly percent: number; readonly bar: string }) {
  return (
    <div className="bg-secondary h-1.75 w-40">
      <div className={cn('h-full', bar)} style={{ width: `${percent}%` }} />
    </div>
  );
}

export function InventoryTable({ products }: { readonly products: readonly InventoryProduct[] }) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  function toggle(productId: string): void {
    setExpanded((current) => {
      const next = new Set(current);

      if (!next.delete(productId)) {
        next.add(productId);
      }

      return next;
    });
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>In stock</TableHead>
            <TableHead className="w-50">Level</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isOpen = expanded.has(product.productId);
            const state = productState(product);
            const needsRestock = product.outCount + product.lowCount;
            const ceiling = Math.max(1, product.variants.length) * BAR_CEILING;
            const percent = Math.min((product.totalUnits / ceiling) * 100, 100);

            return (
              <Fragment key={product.productId}>
                <TableRow>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggle(product.productId)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <ChevronRight
                        aria-hidden="true"
                        className={cn(
                          'text-ink-55 size-4 shrink-0 transition-transform',
                          isOpen && 'rotate-90',
                        )}
                      />
                      <div className="relative h-11.5 w-9.5 shrink-0 overflow-hidden bg-[#e6e4e1]">
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
                      <div className="min-w-0">
                        <div className="font-semibold">{product.productName}</div>
                        <div className="text-ink-55 font-mono text-[11px]">
                          {product.variants.length} variant
                          {product.variants.length === 1 ? '' : 's'} · {product.totalUnits} unit
                          {product.totalUnits === 1 ? '' : 's'}
                          {needsRestock > 0 ? ` · ${needsRestock} to restock` : ''}
                        </div>
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="text-ink-55 font-mono text-xs">—</TableCell>
                  <TableCell className="font-semibold">{product.totalUnits}</TableCell>
                  <TableCell>
                    <StockBar percent={percent} bar={state.bar} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'border px-2.5 py-1 text-xs whitespace-nowrap',
                        state.className,
                      )}
                    >
                      {state.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={ROUTES.admin.editProduct(product.productId)}
                      className="border-line-strong hover:border-foreground inline-block border px-3.5 py-1.75 text-xs transition-colors"
                    >
                      Restock
                    </Link>
                  </TableCell>
                </TableRow>

                {isOpen
                  ? product.variants.map((variant) => {
                      const variantState = stockState(variant.stock);

                      return (
                        <TableRow key={variant.variantId} className="bg-secondary/30">
                          <TableCell className="pl-16">
                            <span className="text-ink-70 font-mono text-xs">
                              {variant.color} · {variant.size}
                            </span>
                          </TableCell>
                          <TableCell className="text-ink-70 font-mono text-xs">
                            {variant.sku}
                          </TableCell>
                          <TableCell className="font-semibold">{variant.stock}</TableCell>
                          <TableCell>
                            <StockBar
                              percent={Math.min((variant.stock / BAR_CEILING) * 100, 100)}
                              bar={variantState.bar}
                            />
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'border px-2.5 py-1 text-xs whitespace-nowrap',
                                variantState.className,
                              )}
                            >
                              {variantState.label}
                            </span>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      );
                    })
                  : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
