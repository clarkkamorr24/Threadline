import Link from 'next/link';
import type { Metadata } from 'next';
import { FolderTree, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { DeleteCategoryButton } from '@/features/admin-categories/ui/delete-category-button';
import { listAdminCategories } from '@/services/adminCategoryService';

export const metadata: Metadata = {
  title: 'Categories · Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();
  const topLevel = categories.filter((category) => category.parentId === null);

  const ordered = topLevel.flatMap((parent) => [
    parent,
    ...categories.filter((category) => category.parentId === parent.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">
            {categories.length} total, {topLevel.length} top level.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.admin.newCategory}>Add category</Link>
        </Button>
      </header>

      {ordered.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Products need a category before they can be created."
          action={
            <Button asChild>
              <Link href={ROUTES.admin.newCategory}>Add category</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Subcategories</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordered.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className={category.parentId ? 'pl-6' : undefined}>
                      <span className="font-medium">{category.name}</span>
                      {category.parentId ? (
                        <Badge variant="outline" className="ml-2">
                          under {category.parentName}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {category.slug}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {category.productCount ?? 0}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{category.childCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          href={ROUTES.admin.editCategory(category.id)}
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil aria-hidden="true" />
                        </Link>
                      </Button>
                      <DeleteCategoryButton
                        categoryId={category.id}
                        categoryName={category.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
