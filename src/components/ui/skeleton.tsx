import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Loading placeholder. Marked `aria-hidden` with a `role="status"` wrapper
 * supplied by the caller, so assistive technology announces "loading" once
 * rather than reciting every individual shape.
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('bg-muted animate-pulse rounded-md', className)}
      {...props}
    />
  );
}
