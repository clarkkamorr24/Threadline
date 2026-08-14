export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;

export const REVIEW_TITLE_MAX = 80;
export const REVIEW_BODY_MAX = 1500;

export interface ReviewModel {
  readonly id: string;
  readonly rating: number;
  readonly title: string;
  readonly body: string;
  readonly authorName: string;
  readonly isVerifiedBuyer: boolean;
  readonly createdAt: string;
}

export interface RatingBucket {
  readonly star: number;
  readonly count: number;
  readonly percent: number;
}

export interface ReviewSummary {
  readonly average: number;
  readonly total: number;
  readonly buckets: readonly RatingBucket[];
}

export const EMPTY_REVIEW_SUMMARY: ReviewSummary = {
  average: 0,
  total: 0,
  buckets: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, percent: 0 })),
};

export function formatAverage(average: number): string {
  return average.toFixed(1);
}
