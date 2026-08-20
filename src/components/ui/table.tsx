import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Semantic table elements are used throughout — screen readers rely on real
 * `<table>` structure for row/column navigation, which a div grid cannot
 * provide. The horizontal scroll container prevents narrow viewports from
 * forcing the whole page to scroll sideways.
 */

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableFooter({ className, ...props }: ComponentProps<'tfoot'>) {
  return <tfoot className={cn('bg-muted/50 border-t font-medium', className)} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={cn(
        'text-ink-55 border-line-strong h-11 border-b-2 px-4.5 text-left align-middle font-mono text-[11px] font-semibold tracking-[0.07em] whitespace-nowrap uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return (
    <td
      className={cn('border-line border-b px-4.5 py-3.75 align-middle text-sm', className)}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return <caption className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />;
}
