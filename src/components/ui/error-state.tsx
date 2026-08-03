'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  readonly title?: string;
  /** Already user-safe: services translate internal failures before this point. */
  readonly message: string;
  readonly onRetry?: () => void;
  readonly className?: string;
}

/**
 * Consistent presentation for a failed data fetch or mutation. Pairs with the
 * error normalization in `lib/errors.ts` — whatever reaches here is safe to
 * display verbatim.
 */
export function ErrorState({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive rounded-full p-3">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mx-auto max-w-prose text-sm">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
