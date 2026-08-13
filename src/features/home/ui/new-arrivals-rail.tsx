'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { ProductSummary } from '@/entities/product/model/types';
import { ProductMedia } from '@/entities/product/ui/product-media';
import { QuickAddButton } from '@/features/cart/ui/quick-add-button';
import { formatMoney } from '@/utils/money';

interface NewArrivalsRailProps {
  readonly products: readonly ProductSummary[];
  readonly isAuthenticated: boolean;
}

export function NewArrivalsRail({ products, isAuthenticated }: NewArrivalsRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: -1 | 1): void {
    railRef.current?.scrollBy({ left: direction * 302, behavior: 'smooth' });
  }

  return (
    <section className="pt-16 pb-2">
      <div className="mx-auto mb-7 flex max-w-360 items-end justify-between px-5 lg:px-10">
        <div>
          <span className="text-brand font-mono text-[11px] tracking-[0.14em] uppercase">
            02 / New Arrivals
          </span>
          <h2 className="font-display mt-2.5 text-[28px] font-extrabold tracking-[-0.02em] md:text-[40px]">
            Fresh this week
          </h2>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous"
            className="border-line-strong hover:border-foreground grid size-10 place-items-center border transition-colors"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Next"
            className="border-line-strong hover:border-foreground grid size-10 place-items-center border transition-colors"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="mx-auto flex max-w-360 snap-x snap-mandatory gap-0.5 overflow-x-auto px-5 pb-2 lg:px-10"
      >
        {products.map((product) => (
          <article
            key={product.id}
            className="border-line bg-background card-hover group w-75 shrink-0 snap-start border"
          >
            <Link href={ROUTES.product(product.slug)} className="relative block h-85">
              <ProductMedia
                src={product.primaryImage?.url ?? null}
                alt={product.primaryImage?.alt ?? product.name}
                sizes="300px"
                label="product"
                className="absolute inset-0"
              />
              {!product.inStock ? (
                <span className="bg-primary text-primary-foreground absolute top-2.5 left-2.5 px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase">
                  Sold out
                </span>
              ) : null}
              <span className="absolute inset-x-0 bottom-0 translate-y-1.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <QuickAddButton
                  productName={product.name}
                  productSlug={product.slug}
                  variantId={product.defaultVariantId}
                  isAuthenticated={isAuthenticated}
                  className="w-full"
                />
              </span>
            </Link>
            <div className="px-4.5 py-4">
              <div className="text-ink-55 font-mono text-[10px] tracking-[0.08em] uppercase">
                {product.categories[0]?.name ?? 'Threadline'}
              </div>
              <Link
                href={ROUTES.product(product.slug)}
                className="font-display mt-1 block text-base font-extrabold"
              >
                {product.name}
              </Link>
              <div className="mt-2 text-[15px]">
                {product.hasPriceRange ? <span className="text-ink-55 text-sm">from </span> : null}
                {formatMoney(product.priceCents)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
