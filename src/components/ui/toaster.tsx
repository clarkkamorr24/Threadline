'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/shared/store/toastStore';
import type { ToastVariant } from '@/shared/store/toastStore';

/**
 * Renders the toast queue. Mounted once in the root layout; everything else
 * interacts through `useToast()`.
 *
 * Radix supplies the live-region semantics — assistive technology announces
 * each toast without stealing focus from what the user is doing.
 */

const VARIANT_STYLES: Readonly<Record<ToastVariant, string>> = {
  default: 'border-border bg-popover text-popover-foreground',
  success: 'border-success/40 bg-popover text-popover-foreground',
  destructive: 'border-destructive/40 bg-popover text-popover-foreground',
};

const VARIANT_ICONS: Readonly<Record<ToastVariant, LucideIcon>> = {
  default: Info,
  success: CheckCircle2,
  destructive: CircleAlert,
};

const VARIANT_ICON_STYLES: Readonly<Record<ToastVariant, string>> = {
  default: 'text-muted-foreground',
  success: 'text-success',
  destructive: 'text-destructive',
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => {
        const Icon = VARIANT_ICONS[toast.variant];

        return (
          <ToastPrimitive.Root
            key={toast.id}
            duration={toast.durationMs}
            // Radix drives the timer; the store is updated when it closes so
            // dismissal has exactly one owner.
            onOpenChange={(open) => {
              if (!open) {
                dismiss(toast.id);
              }
            }}
            className={cn(
              'group pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border p-4 pr-10 shadow-lg',
              'data-[state=closed]:animate-[--animate-out] data-[state=open]:animate-[--animate-in]',
              VARIANT_STYLES[toast.variant],
            )}
          >
            <Icon
              className={cn('mt-0.5 size-5 shrink-0', VARIANT_ICON_STYLES[toast.variant])}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <ToastPrimitive.Title className="text-sm leading-tight font-medium">
                {toast.title}
              </ToastPrimitive.Title>
              {toast.description ? (
                <ToastPrimitive.Description className="text-muted-foreground text-sm break-words">
                  {toast.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-3 right-3 rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Dismiss notification"
            >
              <X className="size-4" aria-hidden="true" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}

      <ToastPrimitive.Viewport className="pointer-events-none fixed right-0 bottom-0 z-100 flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
    </ToastPrimitive.Provider>
  );
}
