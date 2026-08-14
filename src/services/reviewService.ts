import 'server-only';
import {
  EMPTY_REVIEW_SUMMARY,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
} from '@/entities/review/model/types';
import type { ReviewModel, ReviewSummary } from '@/entities/review/model/types';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';

const STAR_ORDER = [5, 4, 3, 2, 1] as const;

export interface CreateReviewInput {
  readonly productId: string;
  readonly rating: number;
  readonly title: string;
  readonly body: string;
}

function toModel(row: {
  id: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedBuyer: boolean;
  createdAt: Date;
  user: { name: string | null; email: string };
}): ReviewModel {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    authorName: row.user.name?.trim() || row.user.email.split('@')[0] || 'Threadline customer',
    isVerifiedBuyer: row.isVerifiedBuyer,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  const grouped = await db.review.groupBy({
    by: ['rating'],
    where: { productId },
    _count: { _all: true },
  });

  const counts = new Map(grouped.map((row) => [row.rating, row._count._all]));
  const total = grouped.reduce((sum, row) => sum + row._count._all, 0);

  if (total === 0) {
    return EMPTY_REVIEW_SUMMARY;
  }

  const weighted = grouped.reduce((sum, row) => sum + row.rating * row._count._all, 0);

  return {
    average: weighted / total,
    total,
    buckets: STAR_ORDER.map((star) => {
      const count = counts.get(star) ?? 0;

      return { star, count, percent: Math.round((count / total) * 100) };
    }),
  };
}

export async function listReviews(
  productId: string,
  take: number,
): Promise<readonly ReviewModel[]> {
  const rows = await db.review.findMany({
    where: { productId },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      isVerifiedBuyer: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: [{ isVerifiedBuyer: 'desc' }, { createdAt: 'desc' }],
    take,
  });

  return rows.map(toModel);
}

export async function countReviews(productId: string): Promise<number> {
  return db.review.count({ where: { productId } });
}

export async function getUserReview(
  userId: string,
  productId: string,
): Promise<ReviewModel | null> {
  const row = await db.review.findUnique({
    where: { productId_userId: { productId, userId } },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      isVerifiedBuyer: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return row ? toModel(row) : null;
}

export async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  const order = await db.order.findFirst({
    where: {
      userId,
      status: { not: 'CANCELLED' },
      items: { some: { productId } },
    },
    select: { id: true },
  });

  return order !== null;
}

export async function upsertReview(userId: string, input: CreateReviewInput): Promise<ReviewModel> {
  const product = await db.product.findUnique({
    where: { id: input.productId },
    select: { id: true, status: true },
  });

  if (!product || product.status !== 'ACTIVE') {
    throw new NotFoundError('That product is no longer available.');
  }

  const rating = Math.min(Math.max(Math.round(input.rating), REVIEW_RATING_MIN), REVIEW_RATING_MAX);
  const isVerifiedBuyer = await hasPurchased(userId, input.productId);

  const row = await db.review.upsert({
    where: { productId_userId: { productId: input.productId, userId } },
    create: {
      productId: input.productId,
      userId,
      rating,
      title: input.title,
      body: input.body,
      isVerifiedBuyer,
    },
    update: {
      rating,
      title: input.title,
      body: input.body,
      isVerifiedBuyer,
    },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      isVerifiedBuyer: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return toModel(row);
}
