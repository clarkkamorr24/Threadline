import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RotateCcw, Truck } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD_CENTS } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import { ProductSelectionProvider } from '@/entities/product/model/product-selection';
import { ProductGrid } from '@/entities/product/ui/product-grid';
import { ProductTabs } from '@/features/catalog/ui/product-tabs';
import { VariantGallery } from '@/features/catalog/ui/variant-gallery';
import { AddToCartForm } from '@/features/cart/ui/add-to-cart-form';
import { FavoriteButton } from '@/features/favorites/ui/favorite-button';
import { getCurrentUser } from '@/lib/auth/session';
import { isAppError } from '@/lib/errors';
import { getCartVariantQuantities } from '@/services/cartService';
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

  const primaryCategory = product.categories[0] ?? null;

  const [user, related] = await Promise.all([
    getCurrentUser(),
    getRelatedProducts(product.id, product.categories.map((category) => category.id), 4),
  ]);
  
  const [favorited, cartQuantities] =
    user?.role === 'USER'
      ? await Promise.all([
          isFavorited(user.id, product.id, null),
          getCartVariantQuantities(user.id),
        ])
      : [false, {}];


  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="text-ink-55 mx-auto max-w-360 px-5 pt-[22px] font-mono text-xs lg:px-10"
      >
        <Link href={ROUTES.home} className="hover:text-foreground">
          Home
        </Link>
        {' / '}
        <Link href={ROUTES.products} className="hover:text-foreground">
          Shop
        </Link>
        {primaryCategory ? (
          <>
            {' / '}
            <Link
              href={ROUTES.category(primaryCategory.slug)}
              className="hover:text-foreground"
            >
              {primaryCategory.name}
            </Link>
          </>
        ) : null}
        {' / '}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <ProductSelectionProvider
        initialColor={product.colors.length === 1 ? (product.colors[0] ?? null) : null}
        initialSize={product.sizes.length === 1 ? (product.sizes[0] ?? null) : null}
      >
        <div className="border-line-strong mx-auto mt-[18px] grid max-w-360 border-t-2 lg:grid-cols-[1.15fr_1fr]">
          <div className="border-line-strong p-5 lg:border-r-2">
            <VariantGallery variants={product.variants} productName={product.name} />
          </div>

          <div className="px-5 py-10 lg:px-12 lg:py-11">
            <div className="text-brand font-mono text-[11px] tracking-[0.14em] uppercase">
              Threadline
            </div>

            <h1 className="font-display mt-2 mb-3 text-[30px] leading-[1.02] font-extrabold tracking-[-0.02em] md:text-[40px]">
              {product.name}
            </h1>

            <div className="border-line mb-5 flex items-center gap-3 border-b pb-[22px]">
              <span className="text-[28px] font-semibold">
                {product.hasPriceRange ? (
                  <span className="text-ink-55 text-lg">from </span>
                ) : null}
                {formatMoney(product.priceCents)}
              </span>
              {!product.inStock ? (
                <span className="bg-secondary text-ink-55 px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase">
                  Sold out
                </span>
              ) : null}
            </div>

            <p className="text-ink-70 mb-6 text-[15px] leading-[1.6]">{product.description}</p>

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <AddToCartForm
                  productName={product.name}
                  variants={product.variants}
                  cartQuantities={cartQuantities}
                  isAuthenticated={user !== null}
                />
              </div>

              <FavoriteButton
                productId={product.id}
                productName={product.name}
                initialIsFavorited={favorited}
                canFavorite={user?.role === 'USER'}
                isAuthenticated={user !== null}
                className="border-line-strong mt-0 size-[52px] shrink-0 rounded-none border"
              />
            </div>

            <ul className="border-line text-ink-70 mt-[26px] flex flex-col gap-3 border-t pt-[18px] text-[13px]">
              <li className="flex items-center gap-2.5">
                <Truck aria-hidden="true" className="text-brand size-4 shrink-0" />
                Free shipping over {formatMoney(FREE_SHIPPING_THRESHOLD_CENTS)} · ships in 1–2 days
              </li>
              <li className="flex items-center gap-2.5">
                <RotateCcw aria-hidden="true" className="text-brand size-4 shrink-0" />
                Free 30-day returns · fully traceable materials
              </li>
            </ul>
          </div>
        </div>
      </ProductSelectionProvider>

      <ProductTabs
        description={product.description}
        material={product.material}
        categoryName={primaryCategory?.name ?? 'Threadline'}
      />

      {related.length > 0 ? (
        <section className="mx-auto mt-11 max-w-360 px-5 pb-16 lg:px-10">
          <h2 className="font-display mb-6 text-[26px] font-extrabold tracking-[-0.02em] md:text-[32px]">
            You may also like
          </h2>
          <ProductGrid products={related} isAuthenticated={user !== null} columns={4} />
        </section>
      ) : null}
    </div>
  );
}
