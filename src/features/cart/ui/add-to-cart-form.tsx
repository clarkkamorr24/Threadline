'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAX_CART_ITEM_QUANTITY } from '@/constants/catalog';
import type { ProductVariantModel } from '@/entities/product/model/types';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { addToCartAction } from '../api/actions';

interface AddToCartFormProps {
  readonly productId: string;
  readonly productName: string;
  readonly variants: readonly ProductVariantModel[];
  readonly baseStock: number;
  readonly isAuthenticated: boolean;
}

export function AddToCartForm({
  productId,
  productName,
  variants,
  baseStock,
  isAuthenticated,
}: AddToCartFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(
    variants.length === 1 ? (variants[0]?.id ?? null) : null,
  );

  const selectedVariant = variants.find((variant) => variant.id === variantId) ?? null;
  const availableStock = variants.length > 0 ? (selectedVariant?.stock ?? 0) : baseStock;
  const needsSelection = variants.length > 0 && selectedVariant === null;
  const [isPending, startTransition] = useTransition();

  const isSoldOut = availableStock <= 0;
  const maxQuantity = Math.min(availableStock, MAX_CART_ITEM_QUANTITY);

  function handleAdd(): void {
    if (!isAuthenticated) {
      router.push(`${ROUTES.signIn}?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    startTransition(async () => {
      const result = await addToCartAction({ productId, variantId, quantity });

      if (!result.success) {
        toast.error('Could not add to cart', result.error.message);
        return;
      }

      toast.success('Added to cart', `${quantity} × ${productName}`);
      router.refresh();
    });
  }

  // Rendered above the stepper so the stock figure always reflects the choice.
  const variantPicker =
    variants.length > 0 ? (
      <div className="flex flex-col gap-2">
        <span id="variant-label" className="text-sm font-medium">
          Size and colour
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="variant-label">
          {variants.map((variant) => {
            const label = [variant.size, variant.color].filter(Boolean).join(' · ');
            const isSelected = variant.id === variantId;

            return (
              <Button
                key={variant.id}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                // Out-of-stock combinations stay visible but unselectable, so
                // the customer can see the option exists.
                disabled={!variant.inStock || isPending}
                onClick={() => setVariantId(variant.id)}
                aria-pressed={isSelected}
              >
                {label}
                {!variant.inStock ? ' — sold out' : ''}
              </Button>
            );
          })}
        </div>
      </div>
    ) : null;

  if (isSoldOut && !needsSelection) {
    return (
      <div className="flex flex-col gap-3">
        {variantPicker}
        <Button disabled size="lg" className="w-full">
          Sold out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {variantPicker}

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

      <Button
        size="lg"
        className="w-full"
        onClick={handleAdd}
        isLoading={isPending}
        disabled={needsSelection}
      >
        {isPending ? null : <ShoppingBag aria-hidden="true" />}
        {needsSelection ? 'Select an option' : 'Add to cart'}
      </Button>
    </div>
  );
}
