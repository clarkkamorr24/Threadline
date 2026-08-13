'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { ImageOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { CartLineItem as CartLineItemModel } from '@/entities/cart/model/types';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/money';
import { removeCartItemAction, updateCartItemAction } from '../api/actions';

interface CartLineItemProps {
  readonly item: CartLineItemModel;
  readonly compact?: boolean;
  readonly onNavigate?: () => void;
}

export function CartLineItem({ item, compact = false, onNavigate }: CartLineItemProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const exceedsStock = item.quantity > item.availableStock;
  const variantLabel = [item.size, item.color].filter(Boolean).join(' · ');

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

  const stepperSize = compact ? 'size-7 text-[15px]' : 'size-9 text-base';

  return (
    <li
      className={cn(
        'border-line flex border-b',
        compact ? 'gap-3.5 py-4.5' : 'gap-5 py-6 pr-0 lg:pr-8',
      )}
    >
      <Link
        href={ROUTES.product(item.slug)}
        onClick={onNavigate}
        className={cn(
          'relative shrink-0 overflow-hidden bg-[#e6e4e1]',
          compact ? 'h-24 w-19' : 'h-35 w-27.5',
        )}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes={compact ? '76px' : '110px'}
            className="object-cover"
          />
        ) : (
          <span className="text-ink-55 grid h-full place-items-center">
            <ImageOff aria-hidden="true" className="size-5" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={ROUTES.product(item.slug)}
              onClick={onNavigate}
              className={cn(
                'font-display block leading-[1.15] font-extrabold',
                compact ? 'text-[15px]' : 'text-[19px]',
              )}
            >
              {item.name}
            </Link>
            {variantLabel ? (
              <div className="text-ink-55 mt-1 font-mono text-[11px] tracking-[0.04em] uppercase">
                {variantLabel}
              </div>
            ) : null}
          </div>

          {compact ? (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              aria-label={`Remove ${item.name}`}
              className="text-ink-55 hover:text-foreground h-fit text-lg leading-none"
            >
              ×
            </button>
          ) : (
            <div className="text-lg font-semibold whitespace-nowrap">
              {formatMoney(item.lineTotalCents)}
            </div>
          )}
        </div>

        {exceedsStock ? (
          <p className="text-destructive mt-1 text-xs">
            Only {item.availableStock} left in stock
          </p>
        ) : null}

        <div
          className={cn(
            'flex items-center justify-between',
            compact ? 'mt-3' : 'mt-auto pt-4.5',
          )}
        >
          <div className={cn('flex items-center border', compact ? 'border-line' : 'border-line-strong')}>
            <button
              type="button"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={isPending || item.quantity <= 1}
              aria-label="Decrease quantity"
              className={cn(stepperSize, 'disabled:opacity-40')}
            >
              −
            </button>
            <span
              className={cn(
                'text-center tabular-nums',
                compact ? 'w-6.5 text-[13px]' : 'w-8.5 text-sm',
              )}
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={isPending || item.quantity >= item.availableStock}
              aria-label="Increase quantity"
              className={cn(stepperSize, 'disabled:opacity-40')}
            >
              +
            </button>
          </div>

          {compact ? (
            <div className="text-sm font-semibold">{formatMoney(item.lineTotalCents)}</div>
          ) : (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="text-brand font-mono text-xs tracking-[0.05em] uppercase disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
