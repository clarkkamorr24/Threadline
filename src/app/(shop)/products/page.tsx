import Link from 'next/link';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { ProductGrid } from '@/entities/product/ui/product-grid';
import { CatalogFilters, CatalogFiltersSheet } from '@/features/catalog/ui/catalog-filters';
import { CatalogPagination } from '@/features/catalog/ui/catalog-pagination';
import { CatalogSort } from '@/features/catalog/ui/catalog-sort';
import { parseProductQuery } from '@/features/catalog/model/searchParams';
import type { RawSearchParams } from '@/features/catalog/model/searchParams';
import { getCurrentUser } from '@/lib/auth/session';
import { listCategories, listProducts, listVariantFacets } from '@/services/productService';

export const metadata: Metadata = {
  title: 'All products',
  description: 'Browse the full Threadline catalogue.',
};

interface ProductsPageProps {
  readonly searchParams: Promise<RawSearchParams>;
}

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const query = parseProductQuery(params);

  const [result, categories, facets, user] = await Promise.all([
    listProducts(query),
    listCategories(),
    listVariantFacets(),
    getCurrentUser(),
  ]);

  const activeCategory = query.categorySlug
    ? categories.find((category) => category.slug === query.categorySlug)
    : undefined;

  const title = query.search ? `“${query.search}”` : (activeCategory?.name ?? 'All products');

  const hasFilters =
    query.categorySlug !== null ||
    query.size !== null ||
    query.color !== null ||
    query.inStockOnly ||
    query.search !== null;

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="text-ink-55 mx-auto max-w-360 px-5 pt-5.5 font-mono text-xs lg:px-10"
      >
        <Link href={ROUTES.home} className="hover:text-foreground">
          Home
        </Link>
        {' / '}
        <Link href={ROUTES.products} className="hover:text-foreground">
          Shop
        </Link>
        {' / '}
        <span className="text-foreground">{title}</span>
      </nav>

      <div className="border-line-strong mx-auto flex max-w-360 flex-wrap items-end justify-between gap-4 border-b-2 px-5 pt-5 pb-6 lg:px-10">
        <div>
          <h1 className="font-display text-[34px] font-extrabold tracking-[-0.03em] md:text-[52px]">
            {title}
          </h1>
          <div className="text-ink-55 mt-1.5 font-mono text-xs">
            {result.total} product{result.total === 1 ? '' : 's'}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <CatalogFiltersSheet
            categories={categories}
            sizes={facets.sizes}
            colors={facets.colors}
          />
          <CatalogSort />
        </div>
      </div>

      <div className="mx-auto grid max-w-360 lg:grid-cols-[248px_1fr]">
        <CatalogFilters categories={categories} sizes={facets.sizes} colors={facets.colors} />

        <div className="px-5 py-5 lg:px-10">
          <ProductGrid
            products={result.items}
            isAuthenticated={user !== null}
            emptyTitle={hasFilters ? 'No products match those filters' : 'No products yet'}
            emptyDescription={
              hasFilters
                ? 'Try removing a filter or two.'
                : 'Products will appear here once the catalogue is stocked.'
            }
            showClearFilters={hasFilters}
          />

          <CatalogPagination
            page={result.page}
            totalPages={result.totalPages}
            searchParams={params}
          />
        </div>
      </div>
    </div>
  );
}
