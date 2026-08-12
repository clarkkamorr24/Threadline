import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import type { ProductSummary } from '@/entities/product/model/types';
import { cn } from '@/lib/utils';
import { ProductCard } from './product-card';

const PRIORITY_IMAGE_COUNT = 4;

interface ProductGridProps {
  readonly products: readonly ProductSummary[];
  readonly isAuthenticated?: boolean;
  readonly columns?: 3 | 4;
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
  readonly showClearFilters?: boolean;
}

export function ProductGrid({
  products,
  isAuthenticated = false,
  columns = 3,
  emptyTitle = 'No products match those filters',
  emptyDescription = 'Try removing a filter or two.',
  showClearFilters = false,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="px-5 py-24 text-center">
        <div className="font-display text-2xl font-extrabold">{emptyTitle}</div>
        <p className="text-ink-70 mt-2">{emptyDescription}</p>
        {showClearFilters ? (
          <Link
            href={ROUTES.products}
            className="bg-primary text-primary-foreground mt-3.5 inline-block px-[22px] py-3 text-sm font-medium"
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <ul
      className={cn(
        'border-line bg-line grid grid-cols-1 gap-px border sm:grid-cols-2',
        columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4',
      )}
    >
      {products.map((product, index) => (
        <li key={product.id} className="bg-background">
          <ProductCard
            product={product}
            isAuthenticated={isAuthenticated}
            priority={index < PRIORITY_IMAGE_COUNT}
          />
        </li>
      ))}
    </ul>
  );
}
