import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import type { CategoryModel } from '@/entities/product/model/types';
import { db } from '@/lib/db';
import { ConflictError, NotFoundError } from '@/lib/errors';

export type AdminCategoryRow = CategoryModel;

export interface CategoryWriteModel {
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
}

const adminCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  _count: { select: { products: true } },
} satisfies Prisma.CategorySelect;

type AdminCategorySelection = Prisma.CategoryGetPayload<{ select: typeof adminCategorySelect }>;

function toAdminCategoryRow(row: AdminCategorySelection): AdminCategoryRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl,
    productCount: row._count.products,
  };
}

export async function listAdminCategories(): Promise<readonly AdminCategoryRow[]> {
  const rows = await db.category.findMany({
    select: adminCategorySelect,
    orderBy: { name: 'asc' },
  });

  return rows.map(toAdminCategoryRow);
}

export async function getCategoryForEdit(id: string): Promise<AdminCategoryRow> {
  const row = await db.category.findUnique({ where: { id }, select: adminCategorySelect });

  if (!row) {
    throw new NotFoundError('Category');
  }

  return toAdminCategoryRow(row);
}

function toSlugConflict(error: unknown): never {
  const isDuplicate =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002';

  if (isDuplicate) {
    throw new ConflictError('That slug is already in use.');
  }

  throw error;
}

export async function createCategory(input: CategoryWriteModel): Promise<{ id: string }> {
  try {
    return await db.category.create({ data: input, select: { id: true } });
  } catch (error) {
    toSlugConflict(error);
  }
}

export async function updateCategory(
  id: string,
  input: CategoryWriteModel,
): Promise<{ id: string }> {
  const existing = await db.category.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    throw new NotFoundError('Category');
  }

  try {
    await db.category.update({ where: { id }, data: input });
    return { id };
  } catch (error) {
    toSlugConflict(error);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await db.category.findUnique({
    where: { id },
    select: { _count: { select: { products: true } } },
  });

  if (!existing) {
    throw new NotFoundError('Category');
  }

  if (existing._count.products > 0) {
    throw new ConflictError(
      `This category still has ${existing._count.products} product(s). Move them first.`,
    );
  }

  await db.category.delete({ where: { id } });
}
