'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';
import { requireAdmin } from '@/lib/auth/session';
import { createAction } from '@/lib/serverAction';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/services/adminCategoryService';
import { categorySchema, updateCategorySchema } from '../model/schema';

function revalidateCategoryViews(): void {
  revalidatePath(ROUTES.admin.categories);
  revalidatePath(ROUTES.products);
  revalidatePath(ROUTES.home);
  revalidatePath('/', 'layout');
}

export const createCategoryAction = createAction(
  'admin.category.create',
  categorySchema,
  async (input): Promise<{ id: string }> => {
    await requireAdmin();

    const result = await createCategory(input);
    revalidateCategoryViews();

    return result;
  },
);

export const updateCategoryAction = createAction(
  'admin.category.update',
  updateCategorySchema,
  async (input): Promise<{ id: string }> => {
    await requireAdmin();

    const { id, ...rest } = input;
    const result = await updateCategory(id, rest);
    revalidateCategoryViews();

    return result;
  },
);

export const deleteCategoryAction = createAction(
  'admin.category.delete',
  z.object({ id: z.string().min(1) }),
  async (input): Promise<{ deleted: true }> => {
    await requireAdmin();

    await deleteCategory(input.id);
    revalidateCategoryViews();

    return { deleted: true };
  },
);
