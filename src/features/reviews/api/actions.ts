'use server';

import { revalidatePath } from 'next/cache';
import { ROUTES } from '@/constants/routes';
import type { ReviewModel } from '@/entities/review/model/types';
import { reviewSchema } from '@/features/reviews/model/schema';
import { requireShopper } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rateLimit';
import { createAction } from '@/lib/serverAction';
import { upsertReview } from '@/services/reviewService';

export const submitReviewAction = createAction(
  'reviews.submit',
  reviewSchema,
  async (input): Promise<ReviewModel> => {
    const user = await requireShopper();
    await enforceRateLimit({ bucket: 'reviews.submit', limit: 20, windowMs: 60_000 });

    const review = await upsertReview(user.id, {
      productId: input.productId,
      rating: input.rating,
      title: input.title,
      body: input.body,
    });

    revalidatePath(ROUTES.product(input.productSlug));

    return review;
  },
);
