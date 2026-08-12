import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ProductMedia } from '@/entities/product/ui/product-media';

const STATS = [
  { value: '14', label: 'Partner mills' },
  { value: '100%', label: 'Traceable' },
  { value: '30d', label: 'Free returns' },
] as const;

export function BrandStory() {
  return (
    <section className="border-line-strong mt-11 grid border-t-2 border-b-2 lg:grid-cols-2">
      <ProductMedia
        src={null}
        alt=""
        sizes="(min-width: 1024px) 50vw, 100vw"
        label="editorial · atelier / makers at work"
        editorial
        className="min-h-[320px] lg:min-h-[480px]"
      />
      <div className="border-line-strong flex flex-col justify-center px-5 py-12 lg:border-l-2 lg:px-14 lg:py-16">
        <span className="text-brand font-mono text-[11px] tracking-[0.14em] uppercase">
          Our story
        </span>
        <h2 className="font-display my-[18px] text-[28px] leading-[1.02] font-extrabold tracking-[-0.025em] md:text-[40px]">
          We make fewer things, better.
        </h2>
        <p className="text-ink-70 max-w-[460px] text-base leading-[1.6]">
          Threadline began with a simple frustration: too much of what we buy is designed to be
          replaced. So we work directly with small mills and workshops to make a tight range of
          pieces from materials that improve with age — and we tell you exactly where every one
          comes from.
        </p>
        <div className="mt-8 flex gap-11">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-[34px] font-extrabold">{stat.value}</div>
              <div className="text-ink-55 font-mono text-[11px] tracking-[0.06em] uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <Link
          href={ROUTES.products}
          className="border-line-strong hover:border-foreground mt-[34px] self-start border px-6 py-[13px] text-sm font-medium transition-colors"
        >
          Read the full story
        </Link>
      </div>
    </section>
  );
}
