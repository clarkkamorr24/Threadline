import { ADMIN_ROWS_PER_PAGE, MAX_PAGE_SIZE } from '@/constants/catalog';

export const ADMIN_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export type AdminListParams = {
  readonly q?: string;
  readonly page?: string;
  readonly limit?: string;
} & Readonly<Record<string, string | undefined>>;

export interface AdminListQuery {
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export function parseAdminListQuery(params: AdminListParams): AdminListQuery {
  const page = Number(params.page);
  const limit = Number(params.limit);

  return {
    search: params.q?.trim() || null,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize:
      Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_PAGE_SIZE) : ADMIN_ROWS_PER_PAGE,
  };
}

export function buildAdminListHref(
  basePath: string,
  current: Readonly<Record<string, string | undefined>>,
  overrides: Readonly<Record<string, string | number | null>>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(current)) {
    if (value) {
      search.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === '') {
      search.delete(key);
      continue;
    }

    search.set(key, String(value));
  }

  const queryString = search.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}
