'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PRODUCT_SORT_OPTIONS } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import type { CategoryModel } from '@/entities/product/model/types';
import { cn } from '@/lib/utils';
import { colorToHex } from '@/utils/colors';

interface CatalogFiltersProps {
  readonly categories: readonly CategoryModel[];
  readonly sizes: readonly string[];
  readonly colors: readonly string[];
}

const FILTER_KEYS = ['category', 'size', 'color', 'instock', 'sort'] as const;

function FilterPanel({ categories, sizes, colors }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildUrl = useCallback(
    (mutate: (params: URLSearchParams) => void): string => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete('page');

      const query = params.toString();
      return query ? `${ROUTES.products}?${query}` : ROUTES.products;
    },
    [searchParams],
  );

  const toggleParam = useCallback(
    (key: string, value: string): void => {
      const normalised = value.toLowerCase();

      router.push(
        buildUrl((params) => {
          if (params.get(key) === normalised) {
            params.delete(key);
          } else {
            params.set(key, normalised);
          }
        }),
      );
    },
    [buildUrl, router],
  );

  const activeSort = searchParams.get('sort') ?? PRODUCT_SORT_OPTIONS[0].value;
  const activeCategory = searchParams.get('category')?.toLowerCase() ?? null;
  const activeSize = searchParams.get('size')?.toLowerCase() ?? null;
  const activeColor = searchParams.get('color')?.toLowerCase() ?? null;
  const inStockOnly = searchParams.get('instock') === 'true';
  const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key) !== null);

  return (
    <div>
      <div className="mb-4.5 flex items-center justify-between">
        <h2 className="font-display text-base font-extrabold">Filter</h2>
        {hasFilters ? (
          <Link
            href={ROUTES.products}
            className="text-brand font-mono text-[11px] tracking-[0.06em] uppercase"
          >
            Clear
          </Link>
        ) : null}
      </div>

      <fieldset className="border-line border-t py-4.5">
        <legend className="sr-only">Sort</legend>
        <h3 className="mb-3 text-[13px] font-semibold">Sort</h3>
        <div className="flex flex-col gap-0.5">
          {PRODUCT_SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => router.push(buildUrl((params) => params.set('sort', option.value)))}
              aria-pressed={activeSort === option.value}
              className="flex items-center gap-2.5 py-1.25 text-left text-[13px]"
            >
              <span
                className={cn(
                  'border-line-strong grid size-3.5 shrink-0 place-items-center rounded-full border',
                  activeSort === option.value && 'border-foreground',
                )}
              >
                {activeSort === option.value ? (
                  <span className="bg-foreground size-2 rounded-full" />
                ) : null}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {categories.length > 0 ? (
        <div className="border-line border-t py-4.5">
          <h3 className="mb-3 text-[13px] font-semibold">Category</h3>
          <div className="flex flex-col gap-2.5 text-[13px]">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleParam('category', category.slug)}
                aria-pressed={activeCategory === category.slug}
                className={cn(
                  'text-left transition-colors',
                  activeCategory === category.slug
                    ? 'text-brand font-semibold'
                    : 'hover:text-brand',
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {sizes.length > 0 ? (
        <div className="border-line border-t py-4.5">
          <h3 className="mb-3 text-[13px] font-semibold">Size</h3>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleParam('size', size)}
                aria-pressed={activeSize === size.toLowerCase()}
                className={cn(
                  'border-line h-9.5 min-w-10 border px-2 text-xs transition-colors',
                  activeSize === size.toLowerCase()
                    ? 'bg-primary text-primary-foreground border-foreground'
                    : 'hover:border-foreground',
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {colors.length > 0 ? (
        <div className="border-line border-t py-4.5">
          <h3 className="mb-3 text-[13px] font-semibold">Colour</h3>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleParam('color', color)}
                title={color}
                aria-label={color}
                aria-pressed={activeColor === color.toLowerCase()}
                style={{ backgroundColor: colorToHex(color) }}
                className={cn(
                  'border-line size-6.5 rounded-full border',
                  activeColor === color.toLowerCase() &&
                    'ring-foreground ring-offset-background ring-2 ring-offset-2',
                )}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-line border-t pt-4.5">
        <h3 className="mb-3 text-[13px] font-semibold">Availability</h3>
        <button
          type="button"
          onClick={() => toggleParam('instock', 'true')}
          aria-pressed={inStockOnly}
          className="flex items-center gap-2.5 text-[13px]"
        >
          <span
            className={cn(
              'border-line-strong grid size-4 shrink-0 place-items-center border',
              inStockOnly && 'bg-primary border-foreground',
            )}
          >
            {inStockOnly ? (
              <span className="text-primary-foreground text-[10px] leading-none">✓</span>
            ) : null}
          </span>
          In stock only
        </button>
      </div>
    </div>
  );
}

export function CatalogFilters(props: CatalogFiltersProps) {
  return (
    <aside className="border-line-strong hidden self-start border-r-2 px-6 py-7 lg:sticky lg:top-24 lg:block">
      <FilterPanel {...props} />
    </aside>
  );
}

export function CatalogFiltersSheet(props: CatalogFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger className="border-line-strong hover:border-foreground flex items-center gap-2 border px-4.5 py-2.75 text-[13px] transition-colors lg:hidden">
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        Filters
      </SheetTrigger>
      <SheetContent side="left" className="w-75 overflow-y-auto px-6 py-7">
        <SheetHeader className="p-0">
          <SheetTitle className="font-display text-base font-extrabold">Filter</SheetTitle>
        </SheetHeader>
        <FilterPanel {...props} />
      </SheetContent>
    </Sheet>
  );
}
