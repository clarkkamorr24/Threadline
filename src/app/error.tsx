'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function RouteError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error('[route-error]', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <ErrorState
        title="This page could not be loaded"
        message="Something went wrong on our side. Trying again often resolves it."
        onRetry={reset}
      />
    </div>
  );
}
