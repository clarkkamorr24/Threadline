'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_PRODUCT_SORT, PRODUCT_SORT_OPTIONS } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';

export function CatalogSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get('sort') ?? DEFAULT_PRODUCT_SORT;

  function handleChange(value: string): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    params.delete('page');

    router.push(`${ROUTES.products}?${params.toString()}`);
  }

  return (
    <Select value={active} onValueChange={handleChange}>
      <SelectTrigger
        aria-label="Sort products"
        className="border-line min-w-52.5 rounded-none text-[13px]"
      >
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
  );
}
