import type { Metadata } from 'next';
import { CatalogPagination } from '@/features/catalog/ui/catalog-pagination';
import { CatalogToolbar } from '@/features/catalog/ui/catalog-toolbar';
import { parseProductQuery } from '@/features/catalog/model/searchParams';
import type { RawSearchParams } from '@/features/catalog/model/searchParams';
import { ProductGrid } from '@/entities/product/ui/product-grid';
import { listCategories, listProducts } from '@/services/productService';

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

  const [result, categories] = await Promise.all([listProducts(query), listCategories()]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {query.search ? `Results for “${query.search}”` : 'All products'}
        </h1>
      </header>

      <CatalogToolbar categories={categories} resultCount={result.total} />

      <ProductGrid
        products={result.items}
        emptyTitle={query.search ? 'No matches' : 'No products yet'}
        emptyDescription={
          query.search
            ? 'Try a different search term, or clear your filters.'
            : 'Products will appear here once the catalogue is stocked.'
        }
      />

      <CatalogPagination
        page={result.page}
        totalPages={result.totalPages}
        searchParams={params}
      />
    </div>
  );
}
