import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .default(null)
    .transform((value) => value?.trim() || null);

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(80, 'Name must be 80 characters or fewer.'),
  slug: z
    .string()
    .min(1, 'Slug is required.')
    .max(80)
    .regex(slugPattern, 'Use lowercase letters, numbers and hyphens only.'),
  description: optionalText(500),
  imageUrl: z
    .string()
    .url('Enter a valid image URL.')
    .nullable()
    .default(null)
    .or(z.literal('').transform(() => null)),
  parentId: z
    .string()
    .nullable()
    .default(null)
    .transform((value) => value || null),
});

export const updateCategorySchema = categorySchema.extend({ id: z.string().min(1) });

export type CategoryInput = z.infer<typeof categorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
