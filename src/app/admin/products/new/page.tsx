import Link from 'next/link';
import type { Metadata } from 'next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ROUTES } from '@/constants/routes';
import { ProductForm } from '@/features/admin-products/ui/product-form';
import type { CreateProductInput } from '@/features/admin-products/model/schema';
import { listCategories } from '@/services/productService';

export const metadata: Metadata = {
  title: 'New product · Admin',
};

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const categories = await listCategories();

  // A product cannot exist without a category, so there is nothing useful to
  // render — say why rather than showing an empty, unusable dropdown.
  // Destructured rather than indexed: `noUncheckedIndexedAccess` does not
  // narrow `categories[0]` from a length check, and this reads better anyway.
  const [firstCategory] = categories;

  if (!firstCategory) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          There are no categories yet. Seed the catalogue (<code>npm run db:seed</code>) or add a
          category before creating products.
        </AlertDescription>
      </Alert>
    );
  }

  const defaultValues: CreateProductInput = {
    name: '',
    slug: '',
    description: '',
    material: null,
    basePrice: 0,
    sku: '',
    baseStock: 0,
    status: 'DRAFT',
    featured: false,
    categoryId: firstCategory.id,
    images: [],
    variants: [],
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-2 text-sm">
          <Link href={ROUTES.admin.products} className="hover:text-foreground">
            ← Back to products
          </Link>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
      </header>

      <ProductForm categories={categories} defaultValues={defaultValues} />
    </div>
  );
}
