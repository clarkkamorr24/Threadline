'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { Cart } from '@/entities/cart/model/types';
import { formatMoney } from '@/utils/money';
import { useCartDrawer } from '../model/cart-drawer-store';
import { CartLineItem } from './cart-line-item';

interface CartDrawerProps {
  readonly cart: Cart;
}

export function CartDrawer({ cart }: CartDrawerProps) {
  const isOpen = useCartDrawer((state) => state.isOpen);
  const close = useCartDrawer((state) => state.close);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  if (!isOpen) {
    return null;
  }

  const hasItems = cart.items.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your bag"
      className="fixed inset-0 z-70 flex justify-end bg-[color-mix(in_srgb,#1c1a19_45%,transparent)]"
      onClick={close}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="bg-background flex h-full w-full max-w-110 flex-col shadow-2xl"
      >
        <div className="border-line-strong flex items-center justify-between border-b-2 px-6 py-5.5">
          <h2 className="font-display text-xl font-extrabold">Your bag ({cart.itemCount})</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close bag"
            className="grid size-9 place-items-center"
          >
            <X aria-hidden="true" className="size-4.5" />
          </button>
        </div>

        {hasItems ? (
          <>
            <ul className="flex-1 overflow-y-auto px-6">
              {cart.items.map((item) => (
                <CartLineItem key={item.id} item={item} compact onNavigate={close} />
              ))}
            </ul>

            <div className="border-line-strong border-t-2 px-6 py-5">
              <div className="text-ink-70 mb-1.5 flex justify-between text-[13px]">
                <span>Subtotal</span>
                <span>{formatMoney(cart.totals.subtotalCents)}</span>
              </div>
              <div className="text-ink-70 mb-3.5 flex justify-between text-[13px]">
                <span>Shipping</span>
                <span>
                  {cart.totals.shippingCents === 0
                    ? 'Free'
                    : formatMoney(cart.totals.shippingCents)}
                </span>
              </div>

              <Link
                href={ROUTES.checkout}
                onClick={close}
                className="bg-primary text-primary-foreground flex items-center justify-center px-4 py-3.75 text-sm font-medium"
              >
                Checkout · {formatMoney(cart.totals.totalCents)}
              </Link>
              <Link
                href={ROUTES.cart}
                onClick={close}
                className="border-line-strong hover:border-foreground mt-2 flex items-center justify-center border px-4 py-3 text-sm transition-colors"
              >
                View full bag
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
            <div className="size-20 rounded-full bg-[repeating-linear-gradient(135deg,#e6e4e1_0_11px,#eceae7_11px_22px)]" />
            <div className="font-display text-xl font-extrabold">Your bag is empty</div>
            <p className="text-ink-70 max-w-60 text-sm">
              Nothing here yet. Explore the collection and add something worth keeping.
            </p>
            <Link
              href={ROUTES.products}
              onClick={close}
              className="bg-primary text-primary-foreground px-6 py-3.25 text-sm font-medium"
            >
              Start shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
