import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Heart, ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ROUTES } from '@/constants/routes';
import { FavoriteButton } from '@/features/favorites/ui/favorite-button';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { listFavorites } from '@/services/favoriteService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Your wishlist',
};

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const user = await requireUserOrRedirect(ROUTES.favorites);

  if (user.role !== 'USER') {
    redirect(ROUTES.admin.root);
  }

  const favorites = await listFavorites(user.id);

  if (favorites.length === 0) {
    return (
      <div>
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it for later."
          action={
            <Button asChild>
              <Link href={ROUTES.products}>Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display mb-4 text-[22px] font-extrabold">Wishlist</h2>

      <ul className="divide-y border-y">
        {favorites.map((favorite) => {
          const variantLabel = [favorite.size, favorite.color].filter(Boolean).join(' · ');

          return (
            <li key={favorite.id} className="flex gap-4 py-5">
              <Link
                href={ROUTES.product(favorite.product.slug)}
                className="bg-muted relative aspect-3/4 w-20 shrink-0 overflow-hidden rounded-md"
              >
                {favorite.product.primaryImage ? (
                  <Image
                    src={favorite.product.primaryImage.url}
                    alt={favorite.product.primaryImage.alt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center">
                    <ImageOff className="size-5" aria-hidden="true" />
                  </div>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-medium">
                    <Link
                      href={ROUTES.product(favorite.product.slug)}
                      className="hover:underline"
                    >
                      {favorite.product.name}
                    </Link>
                  </h2>
                  {variantLabel ? (
                    <p className="text-muted-foreground text-xs">{variantLabel}</p>
                  ) : null}
                  <p className="mt-1 text-sm">
                    {favorite.product.hasPriceRange ? (
                      <span className="text-muted-foreground text-xs">from </span>
                    ) : null}
                    {formatMoney(favorite.product.priceCents)}
                  </p>
                  {!favorite.product.inStock ? (
                    <Badge variant="secondary" className="mt-2">
                      Sold out
                    </Badge>
                  ) : null}
                </div>

                <FavoriteButton
                  productId={favorite.product.id}
                  productName={favorite.product.name}
                  variantId={favorite.variantId}
                  initialIsFavorited
                  canFavorite
                  isAuthenticated
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
