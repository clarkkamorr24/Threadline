import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { ProductGrid } from '@/entities/product/ui/product-grid';
import { getFeaturedProducts, listCategories } from '@/services/productService';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(8),
    listCategories(),
  ]);

  return (
    <div className="flex flex-col">
      <section className="border-b">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-20 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Considered everyday clothing
          </h1>
          <p className="text-muted-foreground mx-auto max-w-prose text-pretty">
            Well-made basics and outerwear in natural fibres. Cut for everyday wear, built to
            outlast the season it was bought in.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href={ROUTES.products}>
                Shop all
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={ROUTES.category(category.slug)}
                className="focus-visible:ring-ring bg-muted group relative flex aspect-4/3 items-end overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
                <span className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                <span className="relative p-4 text-sm font-medium text-white">
                  {category.name}
                  {typeof category.productCount === 'number' ? (
                    <span className="block text-xs font-normal text-white/80">
                      {category.productCount} item{category.productCount === 1 ? '' : 's'}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Featured</h2>
          <Link
            href={ROUTES.products}
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        <ProductGrid
          products={featured}
          emptyTitle="Nothing featured yet"
          emptyDescription="Featured products will appear here once an admin marks some."
        />
      </section>
    </div>
  );
}
