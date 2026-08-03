'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAX_CART_ITEM_QUANTITY } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { addToCartAction } from '../api/actions';

interface AddToCartFormProps {
  readonly productId: string;
  readonly productName: string;
  readonly availableStock: number;
  readonly isAuthenticated: boolean;
}

export function AddToCartForm({
  productId,
  productName,
  availableStock,
  isAuthenticated,
}: AddToCartFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

  const isSoldOut = availableStock <= 0;
  const maxQuantity = Math.min(availableStock, MAX_CART_ITEM_QUANTITY);

  function handleAdd(): void {
    if (!isAuthenticated) {
      router.push(`${ROUTES.signIn}?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    startTransition(async () => {
      const result = await addToCartAction({ productId, quantity });

      if (!result.success) {
        toast.error('Could not add to cart', result.error.message);
        return;
      }

      toast.success('Added to cart', `${quantity} × ${productName}`);
      router.refresh();
    });
  }

  if (isSoldOut) {
    return (
      <Button disabled size="lg" className="w-full">
        Sold out
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span id="quantity-label" className="text-sm font-medium">
          Quantity
        </span>
        <div className="flex items-center rounded-md border" role="group" aria-labelledby="quantity-label">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-r-none"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1 || isPending}
            aria-label="Decrease quantity"
          >
            <Minus aria-hidden="true" />
          </Button>

          <output className="w-10 text-center text-sm tabular-nums" aria-live="polite">
            {quantity}
          </output>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-l-none"
            onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
            disabled={quantity >= maxQuantity || isPending}
            aria-label="Increase quantity"
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>

        {availableStock <= 5 ? (
          <span className="text-muted-foreground text-sm">Only {availableStock} left</span>
        ) : null}
      </div>

      <Button size="lg" className="w-full" onClick={handleAdd} isLoading={isPending}>
        {isPending ? null : <ShoppingBag aria-hidden="true" />}
        Add to cart
      </Button>
    </div>
  );
}
