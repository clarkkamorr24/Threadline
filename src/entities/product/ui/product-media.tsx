import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductMediaProps {
  readonly src: string | null;
  readonly alt: string;
  readonly sizes: string;
  readonly label?: string;
  readonly priority?: boolean;
  readonly editorial?: boolean;
  readonly className?: string;
}

export function ProductMedia({
  src,
  alt,
  sizes,
  label,
  priority = false,
  editorial = false,
  className,
}: ProductMediaProps) {
  if (!src) {
    return (
      <div
        className={cn(
          'relative overflow-hidden',
          'bg-[repeating-linear-gradient(135deg,#e6e4e1_0_11px,#eceae7_11px_22px)]',
          className,
        )}
      >
        {label ? (
          <span className="text-ink-55 absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.06em] uppercase">
            {label}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-[#e6e4e1]', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          'zoom object-cover transition-transform duration-[800ms] ease-[cubic-bezier(.2,.7,.2,1)]',
          editorial && 'grayscale',
        )}
      />
    </div>
  );
}
