import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import type { CategoryModel } from '@/entities/product/model/types';
import { db } from '@/lib/db';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';

export interface AdminCategoryRow extends CategoryModel {
  readonly parentName: string | null;
  readonly childCount: number;
}

export interface CategoryWriteModel {
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly parentId: string | null;
}

const adminCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  parentId: true,
  parent: { select: { name: true } },
  _count: { select: { products: true, children: true } },
} satisfies Prisma.CategorySelect;

type AdminCategorySelection = Prisma.CategoryGetPayload<{ select: typeof adminCategorySelect }>;

function toAdminCategoryRow(row: AdminCategorySelection): AdminCategoryRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl,
    parentId: row.parentId,
    parentName: row.parent?.name ?? null,
    productCount: row._count.products,
    childCount: row._count.children,
  };
}

export async function listAdminCategories(): Promise<readonly AdminCategoryRow[]> {
  const rows = await db.category.findMany({
    select: adminCategorySelect,
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
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

async function assertParentIsValid(parentId: string, selfId?: string): Promise<void> {
  const parent = await db.category.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true },
  });

  if (!parent) {
    throw new NotFoundError('Parent category');
  }

  if (selfId && parent.id === selfId) {
    throw new ValidationError('A category cannot be its own parent.');
  }

  if (parent.parentId !== null) {
    throw new ValidationError('Categories can only nest one level deep.');
  }

  if (selfId) {
    const wouldOrphanChildren = await db.category.count({ where: { parentId: selfId } });

    if (wouldOrphanChildren > 0) {
      throw new ValidationError(
        'This category has subcategories, so it cannot become a subcategory itself.',
      );
    }
  }
}

export async function createCategory(input: CategoryWriteModel): Promise<{ id: string }> {
  if (input.parentId) {
    await assertParentIsValid(input.parentId);
  }

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

  if (input.parentId) {
    await assertParentIsValid(input.parentId, id);
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
    select: { _count: { select: { products: true, children: true } } },
  });

  if (!existing) {
    throw new NotFoundError('Category');
  }

  if (existing._count.products > 0) {
    throw new ConflictError(
      `This category still has ${existing._count.products} product(s). Move them first.`,
    );
  }

  if (existing._count.children > 0) {
    throw new ConflictError(
      `This category has ${existing._count.children} subcategor(y/ies). Delete or move them first.`,
    );
  }

  await db.category.delete({ where: { id } });
}

export async function listParentCategoryOptions(
  excludeId?: string,
): Promise<readonly { id: string; name: string }[]> {
  return db.category.findMany({
    where: { parentId: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
