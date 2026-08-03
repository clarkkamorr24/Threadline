import { create } from 'zustand';

export type ToastVariant = 'default' | 'success' | 'destructive';

export interface Toast {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly variant: ToastVariant;
  readonly durationMs: number;
}

export interface ToastInput {
  readonly title: string;
  readonly description?: string;
  readonly variant?: ToastVariant;
  readonly durationMs?: number;
}

interface ToastState {
  readonly toasts: readonly Toast[];
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION_MS = 5_000;
const MAX_VISIBLE_TOASTS = 3;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (input) => {
    const id = crypto.randomUUID();
    const toast: Toast = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? 'default',
      durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
    };

    set((state) => ({
      toasts: [...state.toasts, toast].slice(-MAX_VISIBLE_TOASTS),
    }));

    return id;
  },

  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  clear: () => set({ toasts: [] }),
}));
