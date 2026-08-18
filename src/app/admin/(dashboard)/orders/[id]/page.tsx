import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ImageOff } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { OrderStatusBadge } from '@/entities/order/ui/order-status-badge';
import { PaymentMark } from '@/entities/order/ui/payment-mark';
import { UserAvatar } from '@/entities/user/ui/user-avatar';
import { OrderDetailActions } from '@/features/admin-orders/ui/order-detail-actions';
import { OrderStatusPanel } from '@/features/admin-orders/ui/order-status-panel';
import { OrderTracking } from '@/features/orders/ui/order-tracking';
import { isAppError } from '@/lib/errors';
import { getOrderForAdmin } from '@/services/orderService';
import { formatDateTime } from '@/utils/datetime';
import { formatMoney } from '@/utils/money';
import { requireAdmin } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Order · Admin',
};

export const dynamic = 'force-dynamic';

interface AdminOrderDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

function customerInitials(name: string | null, email: string): string {
  const source = name?.trim() || email;

  return (
    source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  await requireAdmin();

  const { id } = await params;

  let order;
  try {
    order = await getOrderForAdmin(id);
  } catch (error) {
    if (isAppError(error) && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const address = order.shippingAddress;
  const shipping = order.shippingCents === 0 ? 'Free shipping' : 'Standard shipping';

  const totalRows = [
    { label: 'Subtotal', value: formatMoney(order.subtotalCents) },
    {
      label: 'Shipping',
      value: order.shippingCents === 0 ? 'Free' : formatMoney(order.shippingCents),
    },
    { label: 'Tax', value: formatMoney(order.taxCents) },
  ];

  return (
    <div className="flex flex-col gap-5.5">
      <nav aria-label="Breadcrumb" className="text-brand text-sm font-semibold print:hidden">
        <Link href={ROUTES.admin.orders} className="hover:underline">
          ← Back to orders
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em] md:text-[30px]">
              Order #{order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="text-ink-55 mt-1.5 flex flex-wrap items-center gap-2 font-mono text-xs">
            <span>Placed {formatDateTime(order.placedAt)}</span>
            <span aria-hidden="true">·</span>
            <PaymentMark
              method={order.paymentMethod}
              provider={order.paymentProvider}
              height={16}
            />
            <span aria-hidden="true">·</span>
            <span>{shipping}</span>
          </div>
        </div>

        <OrderDetailActions
          orderId={order.id}
          orderNumber={order.orderNumber}
          status={order.status}
        />
      </header>

      <div className="border-line bg-card border px-6 py-6.5">
        <OrderTracking status={order.status} />
      </div>

      <div className="grid gap-5.5 lg:grid-cols-[1fr_320px]">
        <section className="border-line bg-card border" aria-label="Items">
          <div className="border-line-strong border-b-2 px-5 py-4">
            <h2 className="font-display text-base font-extrabold">Items</h2>
          </div>

          <ul className="px-5">
            {order.items.map((item, index) => {
              const variantLabel = [item.color, item.size].filter(Boolean).join(' · ');

              return (
                <li
                  key={item.id}
                  className={index < order.items.length - 1 ? 'border-line border-b' : ''}
                >
                  <div className="flex items-start gap-4 py-4">
                    <div className="bg-secondary relative h-17.5 w-14 shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-ink-55 grid h-full place-items-center">
                          <ImageOff aria-hidden="true" className="size-4" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={ROUTES.product(item.productSlug)}
                        className="font-semibold hover:underline"
                      >
                        {item.productName}
                      </Link>
                      <div className="text-ink-55 mt-1 font-mono text-xs">
                        {variantLabel ? `${variantLabel} · ` : ''}Qty {item.quantity}
                      </div>
                      {item.sku ? (
                        <div className="text-ink-55 font-mono text-[11px]">{item.sku}</div>
                      ) : null}
                    </div>

                    <div className="font-semibold whitespace-nowrap">
                      {formatMoney(item.lineTotalCents)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <dl className="border-line-strong text-ink-70 flex flex-col gap-2 border-t-2 px-5 py-4.5 text-sm">
            {totalRows.map((row) => (
              <div key={row.label} className="flex justify-between">
                <dt>{row.label}</dt>
                <dd className="text-foreground">{row.value}</dd>
              </div>
            ))}
            <div className="border-line text-foreground font-display mt-1 flex justify-between border-t pt-2.5 text-[17px] font-extrabold">
              <dt>Total</dt>
              <dd>{formatMoney(order.totalCents)}</dd>
            </div>
          </dl>
        </section>

        <aside className="flex flex-col gap-5.5">
          <div className="border-line bg-card border p-5">
            <h2 className="font-display mb-3.5 text-base font-extrabold">Customer</h2>

            <div className="mb-3.5 flex items-center gap-3">
              <UserAvatar
                src={order.customerAvatarUrl}
                initials={customerInitials(order.customerName, order.customerEmail)}
                size={40}
                className="bg-brand rounded-none text-[13px] font-extrabold text-white"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {order.customerName ?? 'Threadline customer'}
                </div>
                <div className="text-ink-55 truncate font-mono text-[11px]">
                  {order.customerEmail}
                </div>
              </div>
            </div>

            <div className="border-line border-t pt-3.5">
              <div className="text-ink-55 mb-1.5 font-mono text-[10px] tracking-[0.06em] uppercase">
                Shipping address
              </div>
              <address className="text-ink-70 text-[13px] leading-[1.5] not-italic">
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
          </div>

          <div className="print:hidden">
            <OrderStatusPanel
              orderId={order.id}
              orderNumber={order.orderNumber}
              status={order.status}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
