'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { addToCartAction } from '../api/actions';

interface QuickAddButtonProps {
  readonly productName: string;
  readonly productSlug: string;
  readonly variantId: string | null;
  readonly isAuthenticated: boolean;
  readonly label?: string;
  readonly className?: string;
}

export function QuickAddButton({
  productName,
  productSlug,
  variantId,
  isAuthenticated,
  label = 'Quick add',
  className,
}: QuickAddButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function handleClick(event: React.MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!variantId) {
      router.push(ROUTES.product(productSlug));
      return;
    }

    if (!isAuthenticated) {
      router.push(`${ROUTES.signIn}?redirectTo=${encodeURIComponent(ROUTES.product(productSlug))}`);
      return;
    }

    startTransition(async () => {
      const result = await addToCartAction({ variantId, quantity: 1 });

      if (!result.success) {
        toast.error('Could not add to cart', result.error.message);
        return;
      }

      toast.success('Added to bag', productName);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'bg-primary text-primary-foreground flex items-center justify-center gap-1.5',
        'px-5 py-3 text-[13px] font-medium disabled:opacity-60',
        className,
      )}
    >
      {isPending ? 'Adding…' : label}
      {isPending ? null : <Plus aria-hidden="true" className="size-4" />}
    </button>
  );
}
