'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';
import { USER_ROLES } from '@/entities/user/model/types';
import type { AdminUserRow } from '@/entities/user/model/types';
import { requireAdmin } from '@/lib/auth/session';
import { ValidationError } from '@/lib/errors';
import { createAction } from '@/lib/serverAction';
import { updateUserRole } from '@/services/userService';

const updateRoleSchema = z.object({
  userId: z.string().uuid('That is not a valid user id.'),
  role: z.enum(USER_ROLES),
});

export const updateUserRoleAction = createAction(
  'admin.user.updateRole',
  updateRoleSchema,
  async (input): Promise<AdminUserRow> => {
    const admin = await requireAdmin();

    if (admin.id === input.userId && input.role !== 'ADMIN') {
      throw new ValidationError('You cannot remove your own administrator access.');
    }

    const updated = await updateUserRole(input.userId, input.role);
    revalidatePath(ROUTES.admin.users);

    return updated;
  },
);
