'use client';

import { useSyncExternalStore } from 'react';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const subscribe = (): (() => void) => () => {};
const getHash = (): string => window.location.hash;
const getServerHash = (): string => '';

function decodeOnce(value: string): string {
  if (!/%[0-9a-f]{2}/i.test(value)) {
    return value;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function fromHash(hash: string): string | null {
  if (!hash.startsWith('#')) {
    return null;
  }

  const params = new URLSearchParams(hash.slice(1));
  const description = params.get('error_description') ?? params.get('error');

  return description ? decodeOnce(description) : null;
}

interface AuthErrorNoticeProps {
  readonly fallback?: string;
}

export function AuthErrorNotice({ fallback }: AuthErrorNoticeProps) {
  const hash = useSyncExternalStore(subscribe, getHash, getServerHash);
  const message = fromHash(hash) ?? (fallback ? decodeOnce(fallback) : null);

  if (!message) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4 rounded-none">
      <CircleAlert aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
