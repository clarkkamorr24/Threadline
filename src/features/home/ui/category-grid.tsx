import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { CategoryModel } from '@/entities/product/model/types';
import { ProductMedia } from '@/entities/product/ui/product-media';

interface CategoryGridProps {
  readonly categories: readonly CategoryModel[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="mx-auto w-full max-w-360 px-5 pt-16 pb-5 lg:px-10">
      <div className="mb-7">
        <span className="text-brand font-mono text-[11px] tracking-[0.14em] uppercase">
          03 / Categories
        </span>
        <h2 className="font-display mt-2.5 text-[28px] font-extrabold tracking-[-0.02em] md:text-[40px]">
          Shop by category
        </h2>
      </div>

      <div className="bg-line-strong grid gap-0.5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={ROUTES.category(category.slug)}
            className="card-hover group relative flex min-h-[260px] items-end p-6"
          >
            <ProductMedia
              src={category.imageUrl}
              alt={category.name}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              label="category"
              editorial
              className="absolute inset-0"
            />
            <div className="relative flex w-full items-end justify-between">
              <div>
                <div className="font-display text-[26px] font-extrabold">{category.name}</div>
                <div className="text-ink-55 mt-0.5 font-mono text-[11px]">
                  {category.productCount ?? 0} pieces
                </div>
              </div>
              <span className="bg-primary text-primary-foreground grid size-10 shrink-0 place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
