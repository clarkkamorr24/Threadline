import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

interface CatalogPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly searchParams: Record<string, string | string[] | undefined>;
}

export function CatalogPagination({ page, totalPages, searchParams }: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefForPage = (target: number): string => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      if (key === 'page' || value === undefined) continue;
      params.set(key, Array.isArray(value) ? (value[0] ?? '') : value);
    }

    if (target > 1) {
      params.set('page', String(target));
    }

    const query = params.toString();
    return query ? `${ROUTES.products}?${query}` : ROUTES.products;
  };

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      {isFirst ? (
        <span
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'pointer-events-none opacity-50')}
          aria-disabled="true"
        >
          <ChevronLeft aria-hidden="true" />
          Previous
        </span>
      ) : (
        <Link
          href={hrefForPage(page - 1)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          rel="prev"
        >
          <ChevronLeft aria-hidden="true" />
          Previous
        </Link>
      )}

      <span className="text-muted-foreground px-2 text-sm" aria-current="page">
        Page {page} of {totalPages}
      </span>

      {isLast ? (
        <span
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'pointer-events-none opacity-50')}
          aria-disabled="true"
        >
          Next
          <ChevronRight aria-hidden="true" />
        </span>
      ) : (
        <Link
          href={hrefForPage(page + 1)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          rel="next"
        >
          Next
          <ChevronRight aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
