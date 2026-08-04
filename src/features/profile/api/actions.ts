'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';
import type { AuthenticatedUser } from '@/entities/user/model/types';
import { requireUser } from '@/lib/auth/session';
import { createAction } from '@/lib/serverAction';
import { updateProfile } from '@/services/userService';

const profileSchema = z.object({
  name: z
    .string()
    .max(80, 'Name must be 80 characters or fewer.')
    .nullable()
    .default(null)
    .transform((value) => value?.trim() || null),
  avatarUrl: z
    .string()
    .url('Enter a valid image URL.')
    .nullable()
    .default(null)
    .or(z.literal('').transform(() => null)),
});

export const updateProfileAction = createAction(
  'profile.update',
  profileSchema,
  async (input): Promise<AuthenticatedUser> => {
    const user = await requireUser();

    const updated = await updateProfile(user.id, input);

    revalidatePath(ROUTES.account);
    revalidatePath('/', 'layout');

    return updated;
  },
);
