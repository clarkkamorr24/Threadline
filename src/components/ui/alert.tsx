import type { ComponentProps } from 'react';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-lg border px-4 py-3 text-sm [&>svg]:size-4 [&>svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive: 'border-destructive/40 text-destructive bg-destructive/5',
        success: 'border-success/40 text-success bg-success/5',
        warning: 'border-warning/40 bg-warning/5 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface AlertProps extends ComponentProps<'div'>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      // `role="alert"` makes screen readers announce the content as soon as it
      // appears, which is the point of surfacing an error inline.
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<'h5'>) {
  return (
    <h5
      className={cn('col-start-2 leading-none font-medium tracking-tight', className)}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('col-start-2 text-sm opacity-90', className)} {...props} />;
}

export { alertVariants };
