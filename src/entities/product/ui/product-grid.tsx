import { PackageSearch } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import type { ProductSummary } from '@/entities/product/model/types';
import { ProductCard } from './product-card';

const PRIORITY_IMAGE_COUNT = 4;

interface ProductGridProps {
  readonly products: readonly ProductSummary[];
  readonly emptyTitle?: string;
  readonly emptyDescription?: string;
}

export function ProductGrid({
  products,
  emptyTitle = 'No products found',
  emptyDescription = 'Try removing a filter or searching for something else.',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState icon={PackageSearch} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < PRIORITY_IMAGE_COUNT} />
        </li>
      ))}
    </ul>
  );
}
