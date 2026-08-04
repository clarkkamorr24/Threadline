'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';
import { requireAdmin } from '@/lib/auth/session';
import { createAction } from '@/lib/serverAction';
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from '@/services/adminProductService';
import {
  createProductSchema,
  toProductWriteModel,
  updateProductSchema,
} from '../model/schema';


function revalidateCatalog(slug?: string): void {
  revalidatePath(ROUTES.admin.products);
  revalidatePath(ROUTES.products);
  revalidatePath(ROUTES.home);

  if (slug) {
    revalidatePath(ROUTES.product(slug));
  }
}

export const createProductAction = createAction(
  'admin.product.create',
  createProductSchema,
  async (input): Promise<{ id: string }> => {
    await requireAdmin();
    const result = await createProduct(toProductWriteModel(input));
    revalidateCatalog(input.slug);

    return result;
  },
);

export const updateProductAction = createAction(
  'admin.product.update',
  updateProductSchema,
  async (input): Promise<{ id: string }> => {
    await requireAdmin();

    const { id, ...rest } = input;
    const result = await updateProduct(id, toProductWriteModel(rest));
    revalidateCatalog(input.slug);

    return result;
  },
);

export const deleteProductAction = createAction(
  'admin.product.delete',
  z.object({ id: z.string().min(1) }),
  async (input): Promise<{ deleted: true }> => {
    await requireAdmin();

    await deleteProduct(input.id);
    revalidateCatalog();

    return { deleted: true };
  },
);
