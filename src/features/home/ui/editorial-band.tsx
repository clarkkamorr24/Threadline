import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import type { ProductSummary } from '@/entities/product/model/types';
import { ProductMedia } from '@/entities/product/ui/product-media';
import { formatMoney } from '@/utils/money';

interface EditorialBandProps {
  readonly product: ProductSummary;
}

export function EditorialBand({ product }: EditorialBandProps) {
  return (
    <section className="mx-auto w-full max-w-360 px-5 pt-5 lg:px-10">
      <Link
        href={ROUTES.product(product.slug)}
        className="card-hover border-line-strong bg-secondary grid border-2 md:grid-cols-2"
      >
        <div className="flex flex-col justify-center px-6 py-10 lg:px-11 lg:py-12">
          <span className="border-line-strong self-start border px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase">
            Just landed
          </span>
          <h3 className="font-display mt-4 mb-2.5 text-[26px] leading-[1.05] font-extrabold tracking-[-0.02em] lg:text-[34px]">
            {product.name}
          </h3>
          <p className="text-ink-70 max-w-[380px] text-[15px]">
            {product.categories.map((category) => category.name).join(' · ')}
          </p>
          <div className="mt-[22px] flex items-center gap-[18px]">
            <span className="text-xl font-semibold">{formatMoney(product.priceCents)}</span>
            <span className="text-[13px] underline underline-offset-4">Shop the piece →</span>
          </div>
        </div>
        <ProductMedia
          src={product.primaryImage?.url ?? null}
          alt={product.primaryImage?.alt ?? product.name}
          sizes="(min-width: 768px) 50vw, 100vw"
          label="product"
          className="min-h-[240px] lg:min-h-[340px]"
        />
      </Link>
    </section>
  );
}
