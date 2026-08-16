'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { toggleFavoriteAction } from '../api/actions';

interface FavoriteButtonProps {
  readonly productId: string;
  readonly productName: string;
  readonly variantId?: string | null;
  readonly initialIsFavorited: boolean;
  readonly canFavorite: boolean;
  readonly isAuthenticated: boolean;
  readonly className?: string;
}

export function FavoriteButton({
  productId,
  productName,
  variantId = null,
  initialIsFavorited,
  canFavorite,
  isAuthenticated,
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isPending, startTransition] = useTransition();
  if (isAuthenticated && !canFavorite) {
    return null;
  }

  function handleToggle(): void {
    if (!isAuthenticated) {
      router.push(`${ROUTES.signIn}?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const next = !isFavorited;
    setIsFavorited(next);

    startTransition(async () => {
      const result = await toggleFavoriteAction({ productId, variantId });

      if (!result.success) {
        setIsFavorited(!next);
        toast.error('Could not update wishlist', result.error.message);
        return;
      }

      setIsFavorited(result.data.isFavorited);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isFavorited}
      aria-label={
        isFavorited ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`
      }
      className={className}
    >
      <Heart
        className={cn('size-4', isFavorited && 'fill-destructive text-destructive')}
        aria-hidden="true"
      />
    </Button>
  );
}
