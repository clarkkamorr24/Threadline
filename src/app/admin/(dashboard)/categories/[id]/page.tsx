import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { CategoryForm } from '@/features/admin-categories/ui/category-form';
import { isAppError } from '@/lib/errors';
import { getCategoryForEdit } from '@/services/adminCategoryService';
import { requireAdmin } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Edit category · Admin',
};

export const dynamic = 'force-dynamic';

interface EditCategoryPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  await requireAdmin();

  const { id } = await params;

  let category;
  try {
    category = await getCategoryForEdit(id);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-2 text-sm">
          <Link href={ROUTES.admin.categories} className="hover:text-foreground">
            ← Back to categories
          </Link>
        </nav>
        <h1 className="font-display text-[22px] font-extrabold">{category.name}</h1>
      </header>

      <CategoryForm
        categoryId={category.id}
        defaultValues={{
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
        }}
      />
    </div>
  );
}
