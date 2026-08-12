import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { ProductForm } from '@/features/admin-products/ui/product-form';
import type { CreateProductInput } from '@/features/admin-products/model/schema';
import type { ProductStatusValue } from '@/entities/product/model/types';
import { isAppError } from '@/lib/errors';
import { getProductForEdit } from '@/services/adminProductService';
import { listCategories } from '@/services/productService';
import { toMajorUnits } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Edit product · Admin',
};

export const dynamic = 'force-dynamic';

interface EditProductPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  let product;
  try {
    product = await getProductForEdit(id);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const categories = await listCategories();

  const defaultValues: CreateProductInput = {
    name: product.name,
    slug: product.slug,
    description: product.description,
    material: product.material,
    basePrice: toMajorUnits(product.basePriceCents),
    status: product.status as ProductStatusValue,
    featured: product.featured,
    categoryIds: product.categories.map((category) => category.id),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size ?? '',
      color: variant.color ?? '',
      sku: variant.sku,
      stock: variant.stock,
      priceOverride:
        variant.priceOverrideCents === null ? null : toMajorUnits(variant.priceOverrideCents),
      images: variant.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        storageKey: image.storageKey,
      })),
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-2 text-sm">
          <Link href={ROUTES.admin.products} className="hover:text-foreground">
            ← Back to products
          </Link>
        </nav>
        <h1 className="font-display text-[22px] font-extrabold">{product.name}</h1>
      </header>

      <ProductForm
        categories={categories}
        productId={product.id}
        defaultValues={defaultValues}
      />
    </div>
  );
}
