import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

interface CartButtonProps {
  readonly itemCount: number;
}

export function CartButton({ itemCount }: CartButtonProps) {
  const hasItems = itemCount > 0;
  const displayCount = itemCount > 99 ? '99+' : String(itemCount);

  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link
        href={ROUTES.cart}
        aria-label={hasItems ? `Cart, ${itemCount} items` : 'Cart, empty'}
      >
        <ShoppingBag aria-hidden="true" />
        {hasItems ? (
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] leading-4.5 font-medium"
          >
            {displayCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
