'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';
import type { AdminUserRow } from '@/entities/user/model/types';
import { requireAdmin } from '@/lib/auth/session';
import { ValidationError } from '@/lib/errors';
import { createAction } from '@/lib/serverAction';
import { setUserActive } from '@/services/userService';

const setActiveSchema = z.object({
  userId: z.string().uuid('That is not a valid user id.'),
  isActive: z.boolean(),
});

export const setUserActiveAction = createAction(
  'admin.user.setActive',
  setActiveSchema,
  async (input): Promise<AdminUserRow> => {
    const admin = await requireAdmin();

    if (admin.id === input.userId) {
      throw new ValidationError('You cannot suspend your own account.');
    }

    const updated = await setUserActive(input.userId, input.isActive);
    revalidatePath(ROUTES.admin.users);

    return updated;
  },
);
