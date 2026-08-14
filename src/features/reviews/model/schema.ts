import { z } from 'zod';
import {
  REVIEW_BODY_MAX,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
  REVIEW_TITLE_MAX,
} from '@/entities/review/model/types';

export const reviewSchema = z.object({
  productId: z.string().min(1),
  productSlug: z.string().min(1),
  rating: z
    .number({ message: 'Select a rating.' })
    .int()
    .min(REVIEW_RATING_MIN, 'Select a rating.')
    .max(REVIEW_RATING_MAX),
  title: z
    .string()
    .trim()
    .min(1, 'Add a short headline.')
    .max(REVIEW_TITLE_MAX, `Keep the headline under ${REVIEW_TITLE_MAX} characters.`),
  body: z
    .string()
    .trim()
    .min(1, 'Tell us about the product.')
    .max(REVIEW_BODY_MAX, `Keep the review under ${REVIEW_BODY_MAX} characters.`),
});

export type ReviewInput = z.input<typeof reviewSchema>;
export type ReviewValues = z.output<typeof reviewSchema>;
