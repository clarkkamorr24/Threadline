import { Star } from 'lucide-react';
import { REVIEW_RATING_MAX, formatAverage } from '@/entities/review/model/types';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  readonly value: number;
  readonly size?: number;
  readonly className?: string;
}

function Row({ size, className }: { readonly size: number; readonly className: string }) {
  return (
    <span className={cn('flex', className)} style={{ width: size * REVIEW_RATING_MAX }}>
      {Array.from({ length: REVIEW_RATING_MAX }, (_, index) => (
        <Star key={index} size={size} strokeWidth={0} fill="currentColor" className="shrink-0" />
      ))}
    </span>
  );
}

export function StarRating({ value, size = 16, className }: StarRatingProps) {
  const clamped = Math.min(Math.max(value, 0), REVIEW_RATING_MAX);
  const percent = (clamped / REVIEW_RATING_MAX) * 100;

  return (
    <span
      role="img"
      aria-label={`${formatAverage(clamped)} out of ${REVIEW_RATING_MAX} stars`}
      className={cn('relative inline-flex shrink-0', className)}
      style={{ width: size * REVIEW_RATING_MAX, height: size }}
    >
      <Row size={size} className="text-line-strong" />
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 overflow-hidden"
        style={{ width: `${percent}%` }}
      >
        <Row size={size} className="text-brand" />
      </span>
    </span>
  );
}
