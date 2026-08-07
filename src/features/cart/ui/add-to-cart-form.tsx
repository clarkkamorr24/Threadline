'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAX_CART_ITEM_QUANTITY } from '@/constants/catalog';
import { useProductSelection } from '@/entities/product/model/product-selection';
import type { ProductVariantModel } from '@/entities/product/model/types';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { addToCartAction } from '../api/actions';

interface AddToCartFormProps {
  readonly productName: string;
  readonly variants: readonly ProductVariantModel[];
  readonly isAuthenticated: boolean;
  readonly cartQuantities?: Readonly<Record<string, number>>;
}

function distinct(values: readonly (string | null)[]): readonly string[] {
  return [...new Set(values.filter((value): value is string => value !== null))];
}

export function AddToCartForm({
  productName,
  variants,
  isAuthenticated,
  cartQuantities = {},
}: AddToCartFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

  const sizes = useMemo(() => distinct(variants.map((variant) => variant.size)), [variants]);
  const colors = useMemo(() => distinct(variants.map((variant) => variant.color)), [variants]);

  const {
    selectedColor,
    selectedSize,
    selectColor: setSelectedColor,
    selectSize: setSelectedSize,
  } = useProductSelection();

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (variant) =>
          (sizes.length === 0 || variant.size === selectedSize) &&
          (colors.length === 0 || variant.color === selectedColor),
      ) ?? null,
    [variants, sizes.length, colors.length, selectedSize, selectedColor],
  );

  const isColorAvailable = (color: string): boolean =>
    variants.some(
      (variant) =>
        variant.color === color &&
        variant.inStock &&
        (selectedSize === null || variant.size === selectedSize),
    );

  const isSizeAvailable = (size: string): boolean =>
    variants.some(
      (variant) =>
        variant.size === size &&
        variant.inStock &&
        (selectedColor === null || variant.color === selectedColor),
    );

  const availableStock = selectedVariant?.stock ?? 0;
  const inCart = selectedVariant ? (cartQuantities[selectedVariant.id] ?? 0) : 0;
  const ceiling = Math.min(availableStock, MAX_CART_ITEM_QUANTITY);
  const maxQuantity = Math.max(0, ceiling - inCart);

  const needsSelection = selectedVariant === null;
  const isSoldOut = selectedVariant !== null && availableStock <= 0;
  const atCartLimit = selectedVariant !== null && !isSoldOut && maxQuantity === 0;

  const [clampedFor, setClampedFor] = useState<string | null>(null);

  if (selectedVariant && clampedFor !== selectedVariant.id) {
    setClampedFor(selectedVariant.id);
    if (quantity > maxQuantity) {
      setQuantity(Math.max(1, maxQuantity));
    }
  }

  function handleAdd(): void {
    if (!isAuthenticated) {
      router.push(`${ROUTES.signIn}?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!selectedVariant) {
      return;
    }

    startTransition(async () => {
      const result = await addToCartAction({ variantId: selectedVariant.id, quantity });

      if (!result.success) {
        toast.error('Could not add to cart', result.error.message);
        return;
      }

      toast.success('Added to cart', `${quantity} × ${productName}`);
      router.refresh();
    });
  }

  const optionClasses = (isSelected: boolean, isAvailable: boolean): string =>
    cn(
      'relative rounded-md border px-3 py-2 text-sm transition-colors',
      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      isSelected && 'border-foreground bg-accent font-medium',
      !isSelected && isAvailable && 'hover:border-foreground/40',
      !isAvailable && 'text-muted-foreground cursor-not-allowed opacity-50 line-through',
    );

  return (
    <div className="flex flex-col gap-5">
      {colors.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span id="color-label" className="text-sm font-medium">
              Colour
            </span>
            {selectedColor ? (
              <span className="text-muted-foreground text-sm">{selectedColor}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="color-label">
            {colors.map((color) => {
              const available = isColorAvailable(color);

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  disabled={isPending}
                  aria-pressed={color === selectedColor}
                  className={optionClasses(color === selectedColor, available)}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {sizes.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span id="size-label" className="text-sm font-medium">
              Size
            </span>
            {selectedSize ? (
              <span className="text-muted-foreground text-sm">{selectedSize}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="size-label">
            {sizes.map((size) => {
              const available = isSizeAvailable(size);

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  disabled={isPending}
                  aria-pressed={size === selectedSize}
                  className={cn(optionClasses(size === selectedSize, available), 'min-w-12')}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {isSoldOut ? (
        <Button disabled size="lg" className="w-full">
          Sold out
        </Button>
      ) : atCartLimit ? (
        <div className="flex flex-col gap-2">
          <Button disabled size="lg" className="w-full">
            Maximum already in cart
          </Button>
          <p className="text-muted-foreground text-sm">
            You have {inCart} of this option in your cart
            {availableStock <= MAX_CART_ITEM_QUANTITY
              ? `, which is all the stock available.`
              : `, the most you can order at once.`}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span id="quantity-label" className="text-sm font-medium">
              Quantity
            </span>
            <div
              className="flex items-center rounded-md border"
              role="group"
              aria-labelledby="quantity-label"
            >
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
                onClick={() => setQuantity((current) => Math.min(maxQuantity || 1, current + 1))}
                disabled={needsSelection || quantity >= maxQuantity || isPending}
                aria-label="Increase quantity"
              >
                <Plus aria-hidden="true" />
              </Button>
            </div>

            {selectedVariant ? (
              <span className="text-muted-foreground text-sm">
                {inCart > 0
                  ? `${inCart} in cart · you can add ${maxQuantity} more`
                  : availableStock <= 5
                    ? `Only ${availableStock} left`
                    : null}
              </span>
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
        </>
      )}
    </div>
  );
}
