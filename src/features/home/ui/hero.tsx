import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { ProductSummary } from '@/entities/product/model/types';
import { ProductMedia } from '@/entities/product/ui/product-media';
import { formatMoney } from '@/utils/money';

interface HeroProps {
  readonly featured: ProductSummary | null;
}

export function Hero({ featured }: HeroProps) {
  return (
    <section className="border-line-strong grid border-b-2 lg:grid-cols-[1.05fr_1fr]">
      <div className="border-line-strong flex flex-col justify-between px-5 py-14 lg:border-r-2 lg:px-10 lg:pt-17.5 lg:pb-16">
        <div>
          <span className="text-brand font-mono text-[11px] tracking-[0.16em] uppercase">
            Fall Collection 2026
          </span>
          <h1 className="font-display mt-5.5 text-[46px] leading-[0.92] font-extrabold tracking-[-0.03em] md:text-[64px] lg:text-[96px]">
            Objects
            <br />
            worth
            <br />
            keeping.
          </h1>
        </div>

        <div className="mt-11 max-w-105">
          <p className="text-ink-70 text-base leading-[1.5]">
            Curated essentials designed for everyday life — built from honest materials, made to be
            lived in and kept for years.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={ROUTES.products}
              className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 px-6.5 py-3.5 text-sm font-medium"
            >
              Explore Collection
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href={`${ROUTES.products}?sort=newest`}
              className="border-line-strong hover:border-foreground inline-flex items-center border px-6.5 py-3.5 text-sm font-medium transition-colors"
            >
              New Arrivals
            </Link>
          </div>
        </div>
      </div>

      <div className="relative min-h-90 lg:min-h-140">
        <ProductMedia
          src={featured?.primaryImage?.url ?? null}
          alt={featured?.primaryImage?.alt ?? featured?.name ?? ''}
          sizes="(min-width: 1024px) 50vw, 100vw"
          label="product · editorial"
          priority
          className="absolute inset-0"
        />

        {featured ? (
          <Link
            href={ROUTES.product(featured.slug)}
            className="border-line-strong bg-background absolute top-6 right-6 max-w-47.5 border p-4"
          >
            <div className="text-brand font-mono text-[10px] tracking-[0.1em] uppercase">
              Featured
            </div>
            <div className="font-display mt-1 text-[15px] leading-[1.15] font-extrabold">
              {featured.name}
            </div>
            <div className="text-ink-70 mt-0.5 text-[13px]">
              {featured.hasPriceRange ? 'from ' : ''}
              {formatMoney(featured.priceCents)}
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
