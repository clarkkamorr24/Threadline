import { StarRating } from '@/entities/review/ui/star-rating';
import { formatAverage } from '@/entities/review/model/types';
import type { ReviewModel, ReviewSummary } from '@/entities/review/model/types';
import { ReviewForm } from './review-form';

interface ReviewSectionProps {
  readonly productId: string;
  readonly productSlug: string;
  readonly summary: ReviewSummary;
  readonly reviews: readonly ReviewModel[];
  readonly ownReview: ReviewModel | null;
  readonly canReview: boolean;
  readonly signInHref: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ReviewSection({
  productId,
  productSlug,
  summary,
  reviews,
  ownReview,
  canReview,
  signInHref,
}: ReviewSectionProps) {
  return (
    <section
      id="reviews"
      className="border-line-strong mx-auto mt-11 grid max-w-360 scroll-mt-24 border-t-2 px-5 pt-14 lg:grid-cols-[320px_1fr] lg:gap-12 lg:px-10"
    >
      <div>
        <h2 className="font-display text-[26px] font-extrabold tracking-[-0.02em] md:text-[32px]">
          Reviews
        </h2>

        {summary.total === 0 ? (
          <p className="text-ink-70 mt-4 text-sm leading-[1.6]">
            No reviews yet. Be the first to share how this piece wears.
          </p>
        ) : (
          <>
            <div className="mt-4 mb-5 flex items-end gap-3">
              <span className="font-display text-[56px] leading-none font-extrabold">
                {formatAverage(summary.average)}
              </span>
              <div className="pb-2">
                <StarRating value={summary.average} size={14} />
                <div className="text-ink-55 mt-0.5 font-mono text-xs">
                  {summary.total} review{summary.total === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {summary.buckets.map((bucket) => (
                <div key={bucket.star} className="flex items-center gap-2.5 text-xs">
                  <span className="text-ink-55 w-3.5 font-mono">{bucket.star}</span>
                  <div className="bg-secondary h-1.5 flex-1">
                    <div className="bg-foreground h-full" style={{ width: `${bucket.percent}%` }} />
                  </div>
                  <span className="text-ink-55 w-8.5 text-right font-mono">{bucket.percent}%</span>
                </div>
              ))}
            </div>
          </>
        )}

        <ReviewForm
          productId={productId}
          productSlug={productSlug}
          existing={canReview ? ownReview : null}
          isAuthenticated={canReview}
          signInHref={signInHref}
        />
      </div>

      <div className="mt-8 flex flex-col lg:mt-0">
        {reviews.map((review) => (
          <article key={review.id} className="border-line border-b py-5.5">
            <div className="flex items-center justify-between gap-3">
              <StarRating value={review.rating} size={13} />
              <span className="text-ink-55 font-mono text-[11px]">
                {formatDate(review.createdAt)}
              </span>
            </div>

            <h3 className="font-display mt-2.5 mb-1.5 text-base font-extrabold">{review.title}</h3>

            <p className="text-ink-70 mb-2 text-sm leading-[1.6] whitespace-pre-line">
              {review.body}
            </p>

            <div className="text-ink-55 font-mono text-[11px]">
              {review.authorName}
              {review.isVerifiedBuyer ? ' · Verified buyer' : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
