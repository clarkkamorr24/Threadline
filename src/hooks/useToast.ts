'use client';

import { useMemo } from 'react';
import { useToastStore } from '@/shared/store/toastStore';
import type { ToastInput } from '@/shared/store/toastStore';

interface UseToastResult {
  readonly toast: (input: ToastInput) => string;
  readonly success: (title: string, description?: string) => string;
  readonly error: (title: string, description?: string) => string;
  readonly dismiss: (id: string) => void;
}

export function useToast(): UseToastResult {
  const push = useToastStore((state) => state.push);
  const dismiss = useToastStore((state) => state.dismiss);

  return useMemo(
    () => ({
      toast: push,
      dismiss,
      success: (title: string, description?: string) =>
        push({ title, description, variant: 'success' }),
      error: (title: string, description?: string) =>
        push({ title, description, variant: 'destructive' }),
    }),
    [push, dismiss],
  );
}
