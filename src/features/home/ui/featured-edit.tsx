import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import type { ProductSummary } from '@/entities/product/model/types';
import { ProductMedia } from '@/entities/product/ui/product-media';
import { QuickAddButton } from '@/features/cart/ui/quick-add-button';
import { cn } from '@/lib/utils';
import { colorToHex } from '@/utils/colors';
import { formatMoney } from '@/utils/money';

interface FeaturedEditProps {
  readonly large: ProductSummary;
  readonly small: readonly ProductSummary[];
  readonly isAuthenticated: boolean;
}

export function FeaturedEdit({ large, small, isAuthenticated }: FeaturedEditProps) {
  return (
    <section className="mx-auto w-full max-w-360 px-5 pt-16 pb-5 lg:px-10">
      <div className="mb-[34px] flex items-end justify-between">
        <div>
          <span className="text-brand font-mono text-[11px] tracking-[0.14em] uppercase">
            01 / Featured
          </span>
          <h2 className="font-display mt-2.5 text-[28px] font-extrabold tracking-[-0.02em] md:text-[40px]">
            The considered edit
          </h2>
        </div>
        <Link href={ROUTES.products} className="hidden text-[13px] hover:underline md:block">
          View all products →
        </Link>
      </div>

      <div
        className={cn(
          'bg-line-strong grid gap-0.5',
          small.length > 0 && 'lg:grid-cols-[1.4fr_1fr]',
        )}
      >
        <article className="card-hover bg-background group relative flex flex-col">
          <Link href={ROUTES.product(large.slug)} className="relative min-h-[320px] flex-1 lg:min-h-[440px]">
            <ProductMedia
              src={large.primaryImage?.url ?? null}
              alt={large.primaryImage?.alt ?? large.name}
              sizes="(min-width: 1024px) 58vw, 100vw"
              label="product"
              className="absolute inset-0"
            />
            <span className="bg-primary text-primary-foreground absolute top-4 left-4 px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase">
              Editor&apos;s pick
            </span>
          </Link>
          <div className="absolute bottom-[104px] left-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <QuickAddButton
              productName={large.name}
              productSlug={large.slug}
              variantId={large.defaultVariantId}
              isAuthenticated={isAuthenticated}
            />
          </div>
          <div className="border-line flex items-start justify-between border-t px-[22px] py-5">
            <div>
              <div className="text-ink-55 font-mono text-[10px] tracking-[0.08em] uppercase">
                {large.categories[0]?.name ?? 'Threadline'}
              </div>
              <div className="font-display mt-1 text-[22px] font-extrabold">{large.name}</div>
            </div>
            <div className="text-lg font-semibold">
              {large.hasPriceRange ? (
                <span className="text-ink-55 text-sm">from </span>
              ) : null}
              {formatMoney(large.priceCents)}
            </div>
          </div>
        </article>

        <div className="bg-line-strong grid gap-0.5">
          {small.map((product) => (
            <article
              key={product.id}
              className="card-hover bg-background group grid grid-cols-2"
            >
              <Link href={ROUTES.product(product.slug)} className="relative min-h-[210px]">
                <ProductMedia
                  src={product.primaryImage?.url ?? null}
                  alt={product.primaryImage?.alt ?? product.name}
                  sizes="(min-width: 1024px) 21vw, 50vw"
                  label="product"
                  className="absolute inset-0"
                />
                <span className="absolute bottom-3 left-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <QuickAddButton
                    productName={product.name}
                    productSlug={product.slug}
                    variantId={product.defaultVariantId}
                    isAuthenticated={isAuthenticated}
                    label="Add"
                    className="px-[15px] py-[9px] text-xs"
                  />
                </span>
              </Link>
              <div className="flex flex-col justify-center p-5">
                <div className="text-ink-55 font-mono text-[10px] tracking-[0.08em] uppercase">
                  {product.categories[0]?.name ?? 'Threadline'}
                </div>
                <Link
                  href={ROUTES.product(product.slug)}
                  className="font-display mt-[5px] text-[18px] leading-[1.15] font-extrabold"
                >
                  {product.name}
                </Link>
                <div className="mt-2 text-[15px]">{formatMoney(product.priceCents)}</div>
                <div className="mt-3 flex gap-1.5">
                  {product.colors.slice(0, 4).map((color) => (
                    <span
                      key={color}
                      title={color}
                      className="border-line size-3.5 rounded-full border"
                      style={{ backgroundColor: colorToHex(color) }}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
