'use client';

import { ShoppingBag } from 'lucide-react';
import { useCartDrawer } from '@/features/cart/model/cart-drawer-store';

interface CartButtonProps {
  readonly itemCount: number;
}

export function CartButton({ itemCount }: CartButtonProps) {
  const open = useCartDrawer((state) => state.open);
  const hasItems = itemCount > 0;
  const displayCount = itemCount > 99 ? '99+' : String(itemCount);

  return (
    <button
      type="button"
      onClick={open}
      aria-label={hasItems ? `Bag, ${itemCount} items` : 'Bag, empty'}
      className="relative grid size-10 place-items-center"
    >
      <ShoppingBag aria-hidden="true" className="size-4.75" />
      {hasItems ? (
        <span
          aria-hidden="true"
          className="bg-brand absolute top-1 right-0.5 grid min-w-3.75 place-items-center rounded-full px-0.75 text-[9px] leading-3.75 font-extrabold text-white"
        >
          {displayCount}
        </span>
      ) : null}
    </button>
  );
}
