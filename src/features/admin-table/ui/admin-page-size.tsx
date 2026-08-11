'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ADMIN_PAGE_SIZE_OPTIONS, buildAdminListHref } from '../model/query';

interface AdminPageSizeProps {
  readonly basePath: string;
  readonly params: Readonly<Record<string, string | undefined>>;
  readonly pageSize: number;
}

export function AdminPageSize({ basePath, params, pageSize }: AdminPageSizeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="admin-page-size" className="text-muted-foreground text-sm whitespace-nowrap">
        Rows per page
      </label>
      <Select
        value={String(pageSize)}
        onValueChange={(value) =>
          startTransition(() => {
            router.push(buildAdminListHref(basePath, params, { limit: value, page: null }));
          })
        }
      >
        <SelectTrigger id="admin-page-size" className="h-8 w-20" aria-busy={isPending}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ADMIN_PAGE_SIZE_OPTIONS.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
