import Link from 'next/link';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { CategoryForm } from '@/features/admin-categories/ui/category-form';

export const metadata: Metadata = {
  title: 'New category · Admin',
};

export const dynamic = 'force-dynamic';

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-2 text-sm">
          <Link href={ROUTES.admin.categories} className="hover:text-foreground">
            ← Back to categories
          </Link>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">New category</h1>
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
