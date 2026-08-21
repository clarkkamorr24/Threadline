import { STORE_NAME } from '@/constants/store';
import { cn } from '@/lib/utils';

interface FullScreenLoaderProps {
  readonly label?: string;
  readonly onDark?: boolean;
  readonly className?: string;
}

export function FullScreenLoader({
  label = 'Loading',
  onDark = false,
  className,
}: FullScreenLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'grid min-h-dvh place-items-center px-5',
        onDark ? 'bg-admin-sidebar' : 'bg-background',
        className,
      )}
    >
      <div className="flex w-full max-w-72 flex-col items-center">
        <div
          className={cn(
            'font-display text-[26px] leading-none font-extrabold tracking-[-0.01em]',
            onDark ? 'text-white' : 'text-foreground',
          )}
        >
          {STORE_NAME.toUpperCase()}
          <span className="text-brand">.</span>
        </div>

        <div
          aria-hidden="true"
          className={cn('mt-6 h-0.5 w-full overflow-hidden', onDark ? 'bg-white/15' : 'bg-line')}
        >
          <div className="loader-bar animate-loader bg-brand h-full w-1/4" />
        </div>

        <div
          className={cn(
            'mt-4 font-mono text-[11px] tracking-[0.14em] uppercase',
            onDark ? 'text-white/50' : 'text-ink-55',
          )}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
