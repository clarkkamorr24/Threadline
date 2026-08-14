'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { ShoppingBag } from 'lucide-react';
import { MAX_CART_ITEM_QUANTITY } from '@/constants/catalog';
import { useProductSelection } from '@/entities/product/model/product-selection';
import type { ProductVariantModel } from '@/entities/product/model/types';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { colorToHex } from '@/utils/colors';
import { formatMoney } from '@/utils/money';
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
  const [pendingAction, setPendingAction] = useState<'add' | 'buy' | null>(null);
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
  const unitPriceCents = selectedVariant?.priceCents ?? 0;
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

  function submit(mode: 'add' | 'buy'): void {
    if (!isAuthenticated) {
      router.push(`${ROUTES.signIn}?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!selectedVariant) {
      return;
    }

    setPendingAction(mode);

    startTransition(async () => {
      const result = await addToCartAction({ variantId: selectedVariant.id, quantity });

      if (!result.success) {
        setPendingAction(null);
        toast.error(
          mode === 'buy' ? 'Could not start checkout' : 'Could not add to cart',
          result.error.message,
        );
        return;
      }

      if (mode === 'buy') {
        router.push(ROUTES.checkout);
        return;
      }

      setPendingAction(null);
      toast.success('Added to cart', `${quantity} × ${productName}`);
      router.refresh();
    });
  }

  const optionClasses = (isSelected: boolean, isAvailable: boolean): string =>
    cn(
      'border-line relative h-11.5 min-w-12 border px-3 text-[13px] transition-colors',
      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      isSelected && 'bg-primary text-primary-foreground border-foreground font-medium',
      !isSelected && isAvailable && 'hover:border-foreground',
      !isAvailable && 'text-ink-55 cursor-not-allowed opacity-50 line-through',
    );

  return (
    <div className="flex flex-col gap-5">
      {colors.length > 0 ? (
        <div className="flex flex-col gap-3">
          <span id="color-label" className="text-[13px] font-semibold">
            Colour{selectedColor ? ` — ${selectedColor}` : ''}
          </span>
          <div className="flex flex-wrap gap-3" role="group" aria-labelledby="color-label">
            {colors.map((color) => {
              const available = isColorAvailable(color);

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  disabled={isPending}
                  title={color}
                  aria-label={color}
                  aria-pressed={color === selectedColor}
                  style={{ backgroundColor: colorToHex(color) }}
                  className={cn(
                    'border-line size-8 rounded-full border',
                    color === selectedColor &&
                      'ring-foreground ring-offset-background ring-2 ring-offset-2',
                    !available && 'opacity-40',
                  )}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {sizes.length > 0 ? (
        <div className="flex flex-col gap-3">
          <span id="size-label" className="text-[13px] font-semibold">
            Size
          </span>
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
        <div className="bg-secondary text-ink-55 flex h-13 items-center justify-center text-[15px]">
          Sold out
        </div>
      ) : atCartLimit ? (
        <div className="flex flex-col gap-2">
          <div className="bg-secondary text-ink-55 flex h-13 items-center justify-center text-[15px]">
            Maximum already in bag
          </div>
          <p className="text-ink-55 text-[13px]">
            You have {inCart} of this option in your cart
            {availableStock <= MAX_CART_ITEM_QUANTITY
              ? `, which is all the stock available.`
              : `, the most you can order at once.`}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-stretch gap-3">
            <div
              className="border-line-strong flex items-center border"
              role="group"
              aria-labelledby="quantity-label"
            >
              <span id="quantity-label" className="sr-only">
                Quantity
              </span>
              <button
                type="button"
                className="h-13 w-11.5 text-lg disabled:opacity-40"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1 || isPending}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <output className="w-10 text-center text-[15px] tabular-nums" aria-live="polite">
                {quantity}
              </output>
              <button
                type="button"
                className="h-13 w-11.5 text-lg disabled:opacity-40"
                onClick={() => setQuantity((current) => Math.min(maxQuantity || 1, current + 1))}
                disabled={needsSelection || quantity >= maxQuantity || isPending}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => submit('add')}
              disabled={needsSelection || isPending}
              className="bg-primary text-primary-foreground flex h-13 flex-1 items-center justify-center gap-2 text-[15px] font-medium disabled:opacity-60"
            >
              {pendingAction === 'add' ? null : (
                <ShoppingBag aria-hidden="true" className="size-4" />
              )}
              {pendingAction === 'add'
                ? 'Adding…'
                : needsSelection
                  ? 'Select an option'
                  : `Add to Cart · ${formatMoney(unitPriceCents * quantity)}`}
            </button>
          </div>

          <button
            type="button"
            onClick={() => submit('buy')}
            disabled={needsSelection || isPending}
            className="border-line-strong hover:border-foreground flex h-12.5 w-full items-center justify-center border text-[15px] font-medium transition-colors disabled:opacity-60"
          >
            {pendingAction === 'buy' ? 'Taking you to checkout…' : 'Buy it now'}
          </button>

          {selectedVariant && (inCart > 0 || availableStock <= 5) ? (
            <p className="text-ink-55 text-[13px]">
              {inCart > 0
                ? `${inCart} in bag · you can add ${maxQuantity} more`
                : `Only ${availableStock} left`}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
