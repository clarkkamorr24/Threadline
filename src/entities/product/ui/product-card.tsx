import Link from 'next/link';
import { Eye } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { ProductSummary } from '@/entities/product/model/types';
import { ProductMedia } from '@/entities/product/ui/product-media';
import { FavoriteButton } from '@/features/favorites/ui/favorite-button';
import { QuickAddButton } from '@/features/cart/ui/quick-add-button';
import { colorToHex } from '@/utils/colors';
import { formatMoney } from '@/utils/money';

interface ProductCardProps {
  readonly product: ProductSummary;
  readonly isAuthenticated?: boolean;
  readonly canFavorite?: boolean;
  readonly isFavorited?: boolean;
  readonly priority?: boolean;
}

export function ProductCard({
  product,
  isAuthenticated = false,
  canFavorite = false,
  isFavorited = false,
  priority = false,
}: ProductCardProps) {
  const href = ROUTES.product(product.slug);

  return (
    <article className="card-hover bg-background group flex flex-col">
      <div className="relative aspect-4/5">
        <ProductMedia
          src={product.primaryImage?.url ?? null}
          alt={product.primaryImage?.alt ?? product.name}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
          label="product"
          priority={priority}
          className="absolute inset-0"
        />

        <Link href={href} className="absolute inset-0" aria-label={product.name} />

        {!product.inStock ? (
          <span className="bg-primary text-primary-foreground pointer-events-none absolute top-2.5 left-2.5 px-2.5 py-1 font-mono text-[10px] tracking-[0.07em] uppercase">
            Sold out
          </span>
        ) : product.isNew ? (
          <span className="bg-primary text-primary-foreground pointer-events-none absolute top-2.5 left-2.5 px-2.5 py-1 font-mono text-[10px] tracking-[0.07em] uppercase">
            New
          </span>
        ) : null}

        <FavoriteButton
          productId={product.id}
          productName={product.name}
          initialIsFavorited={isFavorited}
          canFavorite={canFavorite}
          isAuthenticated={isAuthenticated}
          className="bg-background border-line absolute top-2.5 right-2.5 z-10 mt-0 size-8.5 rounded-none border"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-1.5 gap-px opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
          <QuickAddButton
            productName={product.name}
            productSlug={product.slug}
            variantId={product.defaultVariantId}
            isAuthenticated={isAuthenticated}
            className="flex-1 py-3.25"
          />
          <Link
            href={href}
            aria-label={`Quick view ${product.name}`}
            className="bg-primary text-primary-foreground grid place-items-center px-3.75"
          >
            <Eye aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>

      <div className="px-4 pt-3.75 pb-4.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-ink-55 font-mono text-[10px] tracking-[0.07em] uppercase">
              {product.categories[0]?.name ?? 'Threadline'}
            </div>
            <Link
              href={href}
              className="font-display mt-1 block text-base leading-[1.15] font-extrabold"
            >
              {product.name}
            </Link>
          </div>
          <div className="flex shrink-0 gap-1 pt-0.5">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color}
                title={color}
                className="border-line size-3 rounded-full border"
                style={{ backgroundColor: colorToHex(color) }}
              />
            ))}
          </div>
        </div>
        <div className="mt-2.5 text-[15px] font-semibold">
          {product.hasPriceRange ? <span className="text-ink-55 text-[13px]">from </span> : null}
          {formatMoney(product.priceCents)}
        </div>
      </div>
    </article>
  );
}
