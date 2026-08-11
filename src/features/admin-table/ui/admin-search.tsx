'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEARCH_DEBOUNCE_MS } from '@/constants/catalog';
import { buildAdminListHref } from '../model/query';

interface AdminSearchProps {
  readonly basePath: string;
  readonly params: Readonly<Record<string, string | undefined>>;
  readonly placeholder: string;
  readonly label: string;
}

export function AdminSearch({ basePath, params, placeholder, label }: AdminSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(params.q ?? '');
  const [isPending, startTransition] = useTransition();
  const committed = useRef(params.q ?? '');

  useEffect(() => {
    if (value === committed.current) {
      return;
    }

    const timer = setTimeout(() => {
      committed.current = value;

      startTransition(() => {
        router.push(buildAdminListHref(basePath, params, { q: value.trim() || null, page: null }));
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, basePath, params, router]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        aria-busy={isPending}
        className="pr-9 pl-9"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear search"
          onClick={() => setValue('')}
          className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
