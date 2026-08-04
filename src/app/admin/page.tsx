import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertTriangle, Package, ShoppingCart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { getCatalogStats } from '@/services/adminProductService';
import { getUserStats } from '@/services/userService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Admin overview',
};

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const [catalog, users] = await Promise.all([getCatalogStats(), getUserStats()]);

  const tiles = [
    {
      label: 'Revenue',
      value: formatMoney(catalog.revenueCents),
      hint: `${catalog.totalOrders} order${catalog.totalOrders === 1 ? '' : 's'}`,
      icon: ShoppingCart,
    },
    {
      label: 'Products',
      value: String(catalog.totalProducts),
      hint: `${catalog.activeProducts} active`,
      icon: Package,
    },
    {
      label: 'Out of stock',
      value: String(catalog.outOfStock),
      hint: 'Active products at zero',
      icon: AlertTriangle,
    },
    {
      label: 'Customers',
      value: String(users.totalUsers),
      hint: `${users.newThisMonth} new this month`,
      icon: Users,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm">
            Catalogue and customer activity at a glance.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.admin.newProduct}>Add product</Link>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {tile.label}
                </CardTitle>
                <tile.icon className="text-muted-foreground size-4" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{tile.value}</p>
              <p className="text-muted-foreground text-xs">{tile.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {catalog.outOfStock > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              {catalog.outOfStock} active product{catalog.outOfStock === 1 ? ' is' : 's are'} out
              of stock and still visible in the catalogue.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.admin.products}>Review</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
