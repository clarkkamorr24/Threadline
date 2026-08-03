'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';

export function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(() => searchParams.get('q') ?? '');

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const trimmed = term.trim();
    router.push(trimmed ? `${ROUTES.products}?q=${encodeURIComponent(trimmed)}` : ROUTES.products);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="hidden sm:block">
      <label htmlFor="header-search" className="sr-only">
        Search products
      </label>
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          id="header-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search"
          className="w-40 pl-8 lg:w-56"
        />
      </div>
    </form>
  );
}
