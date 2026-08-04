'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';
import { requireShopper } from '@/lib/auth/session';
import { createAction } from '@/lib/serverAction';
import { toggleFavorite } from '@/services/favoriteService';

const toggleFavoriteSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).nullable().default(null),
});

export const toggleFavoriteAction = createAction(
  'favorites.toggle',
  toggleFavoriteSchema,
  async (input): Promise<{ isFavorited: boolean }> => {
    const user = await requireShopper();

    const result = await toggleFavorite(user.id, input.productId, input.variantId);
    revalidatePath(ROUTES.favorites);

    return result;
  },
);
