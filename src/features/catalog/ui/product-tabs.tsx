'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const TABS = ['Details', 'Materials & Specs', 'Care'] as const;

type TabName = (typeof TABS)[number];

interface ProductTabsProps {
  readonly description: string;
  readonly material: string | null;
  readonly categoryName: string;
}

export function ProductTabs({ description, material, categoryName }: ProductTabsProps) {
  const [active, setActive] = useState<TabName>('Details');

  const specs = [
    { label: 'Material', value: material ?? '—' },
    { label: 'Category', value: categoryName },
    { label: 'Fit', value: 'Relaxed, true to size' },
    { label: 'Origin', value: 'Made in the Philippines' },
  ];

  return (
    <div className="border-line-strong mx-auto mt-9 max-w-360 border-t-2 px-5 pt-14 lg:px-10">
      <div role="tablist" aria-label="Product details" className="border-line flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            onClick={() => setActive(tab)}
            className={cn(
              'font-display mr-7.5 border-b-2 py-3.5 text-base font-extrabold transition-colors',
              active === tab ? 'border-brand text-foreground' : 'text-ink-55 border-transparent',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-180 pt-7 pb-2">
        {active === 'Details' ? (
          <p className="text-ink-70 text-[15px] leading-[1.7]">
            {description} Every Threadline piece is made in small batches and quality-checked by
            hand before it ships.
          </p>
        ) : null}

        {active === 'Materials & Specs' ? (
          <dl className="grid gap-x-10 sm:grid-cols-2">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="border-line flex justify-between border-b py-3"
              >
                <dt className="text-ink-55 font-mono text-xs uppercase">{spec.label}</dt>
                <dd className="text-sm">{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {active === 'Care' ? (
          <p className="text-ink-70 text-[15px] leading-[1.7]">
            Cold machine wash inside out with like colours. Do not tumble dry — lay flat or hang
            in shade. Warm iron if needed. Store folded to keep the shape.
          </p>
        ) : null}
      </div>
    </div>
  );
}
