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
  const [firstCategory] = categories;

  if (!firstCategory) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          There are no categories yet. Add a category before creating products.
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
    status: 'DRAFT',
    featured: false,
    categoryIds: [firstCategory.id],
    variants: [
      { id: null, size: '', color: '', sku: '', stock: 0, priceOverride: null, images: [] },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-2 text-sm">
          <Link href={ROUTES.admin.products} className="hover:text-foreground">
            ← Back to products
          </Link>
        </nav>
        <h1 className="font-display text-[22px] font-extrabold">New product</h1>
      </header>

      <ProductForm categories={categories} defaultValues={defaultValues} />
    </div>
  );
}
