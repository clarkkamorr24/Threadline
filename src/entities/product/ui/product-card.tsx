import Image from 'next/image';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import type { ProductSummary } from '@/entities/product/model/types';
import { formatMoney } from '@/utils/money';

interface ProductCardProps {
  readonly product: ProductSummary;
  readonly priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {

  return (
    <article className="group flex flex-col gap-3">
      <Link
        href={ROUTES.product(product.slug)}
        className="focus-visible:ring-ring bg-muted relative aspect-3/4 overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {product.primaryImage ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.alt}
            fill
            priority={priority}
            // Tells the browser the rendered width per breakpoint so it can
            // pick the right source instead of always downloading the largest.
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <ImageOff className="size-8" aria-hidden="true" />
            <span className="sr-only">No image available</span>
          </div>
        )}

        {!product.inStock ? (
          <Badge variant="secondary" className="absolute top-2 left-2">
            Sold out
          </Badge>
        ) : null}
      </Link>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm leading-snug font-medium">
          <Link href={ROUTES.product(product.slug)} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="text-muted-foreground text-xs">{product.category.name}</p>
        <p className="text-sm">
          {product.hasPriceRange ? (
            <span className="text-muted-foreground text-xs">from </span>
          ) : null}
          <span className="font-medium">{formatMoney(product.priceCents)}</span>
        </p>
      </div>
    </article>
  );
}
