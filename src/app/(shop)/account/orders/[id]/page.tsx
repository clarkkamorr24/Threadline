import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ImageOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/constants/routes';
import { OrderStatusBadge } from '@/entities/order/ui/order-status-badge';
import { requireUserOrRedirect } from '@/lib/auth/session';
import { isAppError } from '@/lib/errors';
import { getOrderById } from '@/services/orderService';
import { formatMoney } from '@/utils/money';

export const metadata: Metadata = {
  title: 'Order details',
};

interface OrderDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const user = await requireUserOrRedirect(ROUTES.order(id));

  let order;
  try {
    order = await getOrderById(user.id, id);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const address = order.shippingAddress;

  const totalRows = [
    { label: 'Subtotal', value: order.subtotalCents },
    { label: 'Shipping', value: order.shippingCents },
    { label: 'Tax', value: order.taxCents },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-6 text-sm">
        <Link href={ROUTES.orders} className="hover:text-foreground">
          ← Back to orders
        </Link>
      </nav>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">
            Placed{' '}
            {new Date(order.placedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <section aria-label="Items">
          <ul className="divide-y border-y">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-5">
                <div className="bg-muted relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded-md">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center">
                      <ImageOff className="size-4" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-medium">
                      <Link href={ROUTES.product(item.productSlug)} className="hover:underline">
                        {item.productName}
                      </Link>
                    </h2>
                    <p className="text-muted-foreground mt-0.5 text-sm">{item.color} - {item.size}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatMoney(item.unitPriceCents)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium whitespace-nowrap">
                    {formatMoney(item.lineTotalCents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-6">
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 font-semibold">Summary</h2>
            <dl className="flex flex-col gap-2 text-sm">
              {totalRows.map((row) => (
                <div key={row.label} className="flex justify-between">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd>
                    {row.label === 'Shipping' && row.value === 0
                      ? 'Free'
                      : formatMoney(row.value)}
                  </dd>
                </div>
              ))}
            </dl>
            <Separator className="my-4" />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatMoney(order.totalCents)}</span>
            </div>
          </div>

          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-3 font-semibold">Shipping to</h2>
            <address className="text-muted-foreground text-sm not-italic">
              {address.fullName}
              <br />
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {address.city}
              {address.state ? `, ${address.state}` : ''} {address.postalCode}
              <br />
              {address.country}
              {address.phone ? (
                <>
                  <br />
                  {address.phone}
                </>
              ) : null}
            </address>
          </div>
        </aside>
      </div>
    </div>
  );
}
