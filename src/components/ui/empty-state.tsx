import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  /** Optional call to action, e.g. "Browse products". */
  readonly action?: ReactNode;
  readonly className?: string;
}

/**
 * The single empty-state presentation used across the catalog, cart, orders and
 * admin tables. Having one component means an empty list is never rendered as
 * a blank area by accident, and the wording stays consistent.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      <div className="bg-muted text-muted-foreground rounded-full p-3">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mx-auto max-w-prose text-sm">{description}</p>
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
