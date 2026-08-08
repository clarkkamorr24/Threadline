'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { ImageOff, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import type { CartLineItem as CartLineItemModel } from '@/entities/cart/model/types';
import { useToast } from '@/hooks/useToast';
import { formatMoney } from '@/utils/money';
import { removeCartItemAction, updateCartItemAction } from '../api/actions';

interface CartLineItemProps {
  readonly item: CartLineItemModel;
}

export function CartLineItem({ item }: CartLineItemProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const exceedsStock = item.quantity > item.availableStock;
  const variantLabel = [item.size, item.color].filter(Boolean).join(' - ');

  function changeQuantity(next: number): void {
    startTransition(async () => {
      const result = await updateCartItemAction({ cartItemId: item.id, quantity: next });

      if (!result.success) {
        toast.error('Could not update quantity', result.error.message);
        return;
      }
      router.refresh();
    });
  }

  function remove(): void {
    startTransition(async () => {
      const result = await removeCartItemAction({ cartItemId: item.id });

      if (!result.success) {
        toast.error('Could not remove item', result.error.message);
        return;
      }
      toast.success('Removed', item.name);
      router.refresh();
    });
  }

  return (
    <li className="flex gap-4 py-6">
      <Link
        href={ROUTES.product(item.slug)}
        className="bg-muted relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded-md sm:w-24"
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="96px" className="object-cover" />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <ImageOff className="size-5" aria-hidden="true" />
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-medium">
              <Link href={ROUTES.product(item.slug)} className="hover:underline">
                {item.name}
              </Link>
            </h3>

            {variantLabel ? (
              <p className="text-muted-foreground mt-0.5 text-sm">{variantLabel}</p>
            ) : null}

            <p className="text-muted-foreground text-sm">
              {formatMoney(item.unitPriceCents)} each
            </p>
          </div>

          <p className="text-sm font-medium whitespace-nowrap sm:text-right">
            {formatMoney(item.lineTotalCents)}
          </p>
        </div>

        {exceedsStock ? (
          <p className="text-destructive text-sm">
            Only {item.availableStock} left — reduce the quantity to check out.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-md border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-r-none"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || isPending}
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <Minus aria-hidden="true" />
            </Button>

            <output className="w-9 text-center text-sm tabular-nums" aria-live="polite">
              {item.quantity}
            </output>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-l-none"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={item.quantity >= item.availableStock || isPending}
              aria-label={`Increase quantity of ${item.name}`}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 aria-hidden="true" />
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}
