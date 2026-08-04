import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/constants/routes';
import { ProductGrid } from '@/entities/product/ui/product-grid';
import { AddToCartForm } from '@/features/cart/ui/add-to-cart-form';
import { FavoriteButton } from '@/features/favorites/ui/favorite-button';
import { getCurrentUser } from '@/lib/auth/session';
import { isAppError } from '@/lib/errors';
import { isFavorited } from '@/services/favoriteService';
import { getProductBySlug, getRelatedProducts } from '@/services/productService';
import { formatMoney } from '@/utils/money';

interface ProductPageProps {
  readonly params: Promise<{ slug: string }>;
}

async function findProduct(slug: string) {
  try {
    return await getProductBySlug(slug);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getProductBySlug(slug);

    return {
      title: product.name,
      description: product.description.slice(0, 160),
      openGraph: {
        title: product.name,
        description: product.description.slice(0, 160),
        images: product.primaryImage ? [{ url: product.primaryImage.url }] : undefined,
      },
    };
  } catch {
    return { title: 'Product not found' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await findProduct(slug);

  const [user, related] = await Promise.all([
    getCurrentUser(),
    getRelatedProducts(product.id, product.category.id, 4),
  ]);
  
  const favorited =
    user?.role === 'USER' ? await isFavorited(user.id, product.id, null) : false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-6 text-sm">
        <ol className="flex items-center gap-2">
          <li>
            <Link href={ROUTES.products} className="hover:text-foreground">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={ROUTES.category(product.category.slug)}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="bg-muted relative aspect-3/4 overflow-hidden rounded-xl">
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                <ImageOff className="size-10" aria-hidden="true" />
                <span className="sr-only">No image available</span>
              </div>
            )}
          </div>

          {product.images.length > 1 ? (
            <ul className="grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((image) => (
                <li key={image.id} className="bg-muted relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="12vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              {product.name}
            </h1>

            <div className="flex items-center gap-3">
              <p className="text-2xl font-medium">
                {product.hasPriceRange ? (
                  <span className="text-muted-foreground text-base">from </span>
                ) : null}
                {formatMoney(product.priceCents)}
              </p>
              {!product.inStock ? <Badge variant="secondary">Sold out</Badge> : null}
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed text-pretty">
            {product.description}
          </p>

          <Separator />

          <div className="flex items-start gap-3">
            <div className="flex-1">
              <AddToCartForm
            productId={product.id}
            productName={product.name}
            variants={product.variants}
            baseStock={product.baseStock}
                isAuthenticated={user !== null}
              />
            </div>

            <FavoriteButton
              productId={product.id}
              productName={product.name}
              initialIsFavorited={favorited}
              canFavorite={user?.role === 'USER'}
              isAuthenticated={user !== null}
              className="mt-7 shrink-0"
            />
          </div>

          <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="font-medium">SKU</dt>
            <dd>{product.sku}</dd>
            <dt className="font-medium">Material</dt>
            <dd>{product.material ?? '—'}</dd>
            <dt className="font-medium">Category</dt>
            <dd>{product.category.name}</dd>
            <dt className="font-medium">Availability</dt>
            <dd>{product.inStock ? 'In stock' : 'Out of stock'}</dd>
          </dl>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">You might also like</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </div>
  );
}
