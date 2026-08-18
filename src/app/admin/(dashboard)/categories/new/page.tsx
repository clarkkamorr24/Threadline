import Link from 'next/link';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { CategoryForm } from '@/features/admin-categories/ui/category-form';
import { requireAdmin } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'New category · Admin',
};

export const dynamic = 'force-dynamic';

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-2 text-sm">
          <Link href={ROUTES.admin.categories} className="hover:text-foreground">
            ← Back to categories
          </Link>
        </nav>
        <h1 className="font-display text-[22px] font-extrabold">New category</h1>
      </header>

      <CategoryForm
        defaultValues={{
          name: '',
          slug: '',
          description: null,
          imageUrl: null,
        }}
      />
    </div>
  );
}
