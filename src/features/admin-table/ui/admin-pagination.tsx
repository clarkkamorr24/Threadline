import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buildAdminListHref } from '../model/query';
import { AdminPageSize } from './admin-page-size';

interface AdminPaginationProps {
  readonly basePath: string;
  readonly params: Readonly<Record<string, string | undefined>>;
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly noun: string;
}

export function AdminPagination({
  basePath,
  params,
  page,
  pageSize,
  total,
  totalPages,
  noun,
}: AdminPaginationProps) {
  if (total === 0) {
    return null;
  }

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
    >
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          Showing <span className="tabular-nums">{first}</span>–
          <span className="tabular-nums">{last}</span> of{' '}
          <span className="tabular-nums">{total}</span> {noun}
        </p>

        <AdminPageSize basePath={basePath} params={params} pageSize={pageSize} />
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center gap-3">
          <Button asChild={page > 1} variant="outline" size="sm" disabled={page <= 1}>
            {page > 1 ? (
              <Link href={buildAdminListHref(basePath, params, { page: page - 1 })}>Previous</Link>
            ) : (
              <span>Previous</span>
            )}
          </Button>

          <span className="text-muted-foreground text-sm whitespace-nowrap">
            Page <span className="tabular-nums">{page}</span> of{' '}
            <span className="tabular-nums">{totalPages}</span>
          </span>

          <Button asChild={page < totalPages} variant="outline" size="sm" disabled={page >= totalPages}>
            {page < totalPages ? (
              <Link href={buildAdminListHref(basePath, params, { page: page + 1 })}>Next</Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      ) : null}
    </nav>
  );
}
