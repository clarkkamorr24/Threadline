'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRODUCT_SORT_OPTIONS, SEARCH_DEBOUNCE_MS } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import type { CategoryModel } from '@/entities/product/model/types';
import { useDebounce } from '@/hooks/useDebounce';

interface CatalogToolbarProps {
  readonly categories: readonly CategoryModel[];
  readonly sizes: readonly string[];
  readonly colors: readonly string[];
  readonly resultCount: number;
}

const ALL_CATEGORIES = '__all__';
const ANY_VALUE = '__any__';

export function CatalogToolbar({ categories, sizes, colors, resultCount }: CatalogToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlSearchTerm = searchParams.get('q') ?? '';
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [syncedUrlTerm, setSyncedUrlTerm] = useState(urlSearchTerm);
  const debouncedTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  if (syncedUrlTerm !== urlSearchTerm) {
    setSyncedUrlTerm(urlSearchTerm);
    setSearchTerm(urlSearchTerm);
  }

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

  useEffect(() => {
    if (debouncedTerm !== searchTerm) {
      return;
    }

    if (debouncedTerm.trim() === urlSearchTerm) {
      return;
    }

    router.push(
      buildUrl((params) => {
        if (debouncedTerm.trim()) {
          params.set('q', debouncedTerm.trim());
        } else {
          params.delete('q');
        }
      }),
    );
  }, [debouncedTerm, searchTerm, urlSearchTerm, buildUrl, router]);

  const activeCategory = searchParams.get('category') ?? ALL_CATEGORIES;
  const activeSort = searchParams.get('sort') ?? PRODUCT_SORT_OPTIONS[0].value;
  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="catalog-search" className="sr-only">
            Search products
          </label>
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="catalog-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search products"
            className="pl-8"
          />
        </div>

        <Select
          value={activeCategory}
          onValueChange={(value) =>
            router.push(
              buildUrl((params) => {
                if (value === ALL_CATEGORIES) {
                  params.delete('category');
                } else {
                  params.set('category', value);
                }
              }),
            )
          }
        >
          <SelectTrigger className="sm:w-48" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={activeSort}
          onValueChange={(value) =>
            router.push(buildUrl((params) => params.set('sort', value)))
          }
        >
          <SelectTrigger className="sm:w-48" aria-label="Sort products">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sizes.length > 0 || colors.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          {sizes.length > 0 ? (
            <Select
              value={searchParams.get('size') ?? ANY_VALUE}
              onValueChange={(value) =>
                router.push(
                  buildUrl((params) => {
                    if (value === ANY_VALUE) {
                      params.delete('size');
                    } else {
                      params.set('size', value);
                    }
                  }),
                )
              }
            >
              <SelectTrigger className="sm:w-40" aria-label="Filter by size">
                <SelectValue placeholder="Any size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Any size</SelectItem>
                {sizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {colors.length > 0 ? (
            <Select
              value={searchParams.get('color') ?? ANY_VALUE}
              onValueChange={(value) =>
                router.push(
                  buildUrl((params) => {
                    if (value === ANY_VALUE) {
                      params.delete('color');
                    } else {
                      params.set('color', value);
                    }
                  }),
                )
              }
            >
              <SelectTrigger className="sm:w-40" aria-label="Filter by colour">
                <SelectValue placeholder="Any colour" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Any colour</SelectItem>
                {colors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Button
            variant={searchParams.get('inStock') === 'true' ? 'default' : 'outline'}
            size="sm"
            className="sm:ml-auto"
            onClick={() =>
              router.push(
                buildUrl((params) => {
                  if (params.get('inStock') === 'true') {
                    params.delete('inStock');
                  } else {
                    params.set('inStock', 'true');
                  }
                }),
              )
            }
          >
            In stock only
          </Button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {/* aria-live so screen readers hear the count change after filtering. */}
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'product' : 'products'}
        </p>

        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={() => router.push(ROUTES.products)}>
            <X aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
