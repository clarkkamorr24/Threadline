import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { getCurrentUser } from '@/lib/auth/session';
import { getFeaturedProducts, listCategories, listProducts } from '@/services/productService';
import { BrandStory } from '@/features/home/ui/brand-story';
import { CategoryGrid } from '@/features/home/ui/category-grid';
import { EditorialBand } from '@/features/home/ui/editorial-band';
import { FeaturedEdit } from '@/features/home/ui/featured-edit';
import { Hero } from '@/features/home/ui/hero';
import { NewArrivalsRail } from '@/features/home/ui/new-arrivals-rail';
import { Newsletter } from '@/features/home/ui/newsletter';
import { ValueStrip } from '@/features/home/ui/value-strip';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featured, categories, newest, user] = await Promise.all([
    getFeaturedProducts(8),
    listCategories(),
    listProducts({
      search: null,
      categorySlug: null,
      size: null,
      color: null,
      minPriceCents: null,
      maxPriceCents: null,
      inStockOnly: false,
      sort: 'newest',
      page: 1,
      pageSize: 8,
    }),
    getCurrentUser(),
  ]);

  const isAuthenticated = user !== null;
  const [largeFeature, ...restFeatured] = featured;
  const smallFeatures = restFeatured.slice(0, 2);
  const bandProduct = restFeatured[2] ?? null;

  return (
    <div className="flex flex-col">
      <Hero featured={largeFeature ?? null} />

      <ValueStrip />

      {largeFeature ? (
        <FeaturedEdit
          large={largeFeature}
          small={smallFeatures}
          isAuthenticated={isAuthenticated}
        />
      ) : null}

      {bandProduct ? <EditorialBand product={bandProduct} /> : null}

      {newest.items.length > 0 ? (
        <NewArrivalsRail products={newest.items} isAuthenticated={isAuthenticated} />
      ) : null}

      {categories.length > 0 ? <CategoryGrid categories={categories} /> : null}

      <BrandStory />

      <Newsletter />

      {featured.length === 0 && newest.items.length === 0 ? (
        <section className="mx-auto w-full max-w-360 px-5 py-24 lg:px-10">
          <p className="text-ink-70 text-[15px]">
            The catalogue is empty.{' '}
            <Link href={ROUTES.products} className="text-brand">
              Browse all products
              <ArrowRight aria-hidden="true" className="ml-1 inline size-4" />
            </Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}
