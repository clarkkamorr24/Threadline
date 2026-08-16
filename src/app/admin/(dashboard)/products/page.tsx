import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ImageOff, Package, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constants/routes';
import { parseAdminListQuery, type AdminListParams } from '@/features/admin-table/model/query';
import { AdminPagination } from '@/features/admin-table/ui/admin-pagination';
import { AdminSearch } from '@/features/admin-table/ui/admin-search';
import { PRODUCT_STATUSES } from '@/entities/product/model/types';
import type { ProductStatusValue } from '@/entities/product/model/types';
import { DeleteProductButton } from '@/features/admin-products/ui/delete-product-button';
import { listAdminProducts } from '@/services/adminProductService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Products · Admin',
};

export const dynamic = 'force-dynamic';

const STATUS_VARIANT: Readonly<Record<ProductStatusValue, BadgeProps['variant']>> = {
  DRAFT: 'secondary',
  ACTIVE: 'success',
  ARCHIVED: 'outline',
};

interface AdminProductsPageProps {
  readonly searchParams: Promise<AdminListParams & { status?: string }>;
}

function parseStatus(value: string | undefined): ProductStatusValue | null {
  return value && (PRODUCT_STATUSES as readonly string[]).includes(value)
    ? (value as ProductStatusValue)
    : null;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams;
  const listQuery = parseAdminListQuery(params);

  const result = await listAdminProducts({
    ...listQuery,
    status: parseStatus(params.status),
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-extrabold">Products</h1>
          <p className="text-ink-55 text-sm">
            {result.total} product{result.total === 1 ? '' : 's'} in the catalogue.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.admin.newProduct}>Add product</Link>
        </Button>
      </header>

      <AdminSearch
        basePath={ROUTES.admin.products}
        params={params}
        placeholder="Search products…"
        label="Search products"
      />

      {result.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start building the catalogue."
          action={
            <Button asChild>
              <Link href={ROUTES.admin.newProduct}>Add product</Link>
            </Button>
          }
        />
      ) : (
        <div className="border-line border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md">
                        {product.primaryImageUrl ? (
                          <Image
                            src={product.primaryImageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="text-muted-foreground flex h-full items-center justify-center">
                            <ImageOff className="size-4" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {product.categoryNames.join(', ')}
                          {product.featured ? ' · Featured' : ''}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[product.status]}>
                      {product.status.charAt(0) + product.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(product.basePriceCents)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.totalStock === 0 ? (
                      <span className="text-destructive">0</span>
                    ) : (
                      product.totalStock
                    )}
                    {product.variantCount > 0 ? (
                      <span className="text-muted-foreground block text-xs">
                        {product.variantCount} variant
                        {product.variantCount === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          href={ROUTES.admin.editProduct(product.id)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil aria-hidden="true" />
                        </Link>
                      </Button>
                      <DeleteProductButton productId={product.id} productName={product.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminPagination
        basePath={ROUTES.admin.products}
        params={params}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        totalPages={result.totalPages}
        noun="products"
      />
    </div>
  );
}
