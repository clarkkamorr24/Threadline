import Link from 'next/link';
import type { Metadata } from 'next';
import { Package } from 'lucide-react';
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
import { ADMIN_ROWS_PER_PAGE } from '@/constants/catalog';
import { ROUTES } from '@/constants/routes';
import { OrderStatusBadge } from '@/entities/order/ui/order-status-badge';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { listOrders } from '@/services/orderService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Your orders',
};

interface OrdersPageProps {
  readonly searchParams: Promise<{ page?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await requireUserOrRedirect(ROUTES.orders);
  const { page: rawPage } = await searchParams;

  const parsedPage = Number(rawPage);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const orders = await listOrders(user.id, page, ADMIN_ROWS_PER_PAGE);

  if (orders.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Orders you place will appear here with their status and totals."
          action={
            <Button asChild>
              <Link href={ROUTES.products}>Start shopping</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Your orders</h1>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.items.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link
                    href={ROUTES.order(order.id)}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(order.placedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-muted-foreground">{order.itemCount}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMoney(order.totalCents)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {orders.totalPages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${ROUTES.orders}?page=${page - 1}`}>Previous</Link>
            </Button>
          ) : null}
          <span className="text-muted-foreground text-sm">
            Page {orders.page} of {orders.totalPages}
          </span>
          {page < orders.totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${ROUTES.orders}?page=${page + 1}`}>Next</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
