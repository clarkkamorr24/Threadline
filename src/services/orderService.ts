import 'server-only';
import { randomInt } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client';
import type {
  AdminOrderRow,
  OrderDetail,
  OrderLineItem,
  OrderStatusValue,
  OrderSummary,
  ShippingAddress,
} from '@/entities/order/model/types';
import { canTransition } from '@/entities/order/model/types';
import type { Paginated } from '@/entities/product/model/types';
import { db } from '@/lib/db';
import { ConflictError, InsufficientStockError, NotFoundError, ValidationError } from '@/lib/errors';
import { getPaymentPlugin } from '@/lib/plugins/payment/registry';
import { calculateTotals } from '@/utils/pricing';

const orderDetailSelect = {
  id: true,
  orderNumber: true,
  status: true,
  subtotalCents: true,
  shippingCents: true,
  taxCents: true,
  totalCents: true,
  shippingAddress: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      variantId: true,
      productName: true,
      productSlug: true,
      variantSize: true,
      variantColor: true,
      sku: true,
      imageUrl: true,
      unitPriceCents: true,
      quantity: true,
    },
  },
} satisfies Prisma.OrderSelect;

type OrderDetailRow = Prisma.OrderGetPayload<{ select: typeof orderDetailSelect }>;

function toOrderLineItem(row: OrderDetailRow['items'][number]): OrderLineItem {
  return {
    id: row.id,
    productId: row.productId,
    variantId: row.variantId,
    productName: row.productName,
    productSlug: row.productSlug,
    size: row.variantSize,
    color: row.variantColor,
    sku: row.sku,
    imageUrl: row.imageUrl,
    unitPriceCents: row.unitPriceCents,
    quantity: row.quantity,
    lineTotalCents: row.unitPriceCents * row.quantity,
  };
}

function toOrderDetail(row: OrderDetailRow): OrderDetail {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status as OrderStatusValue,
    subtotalCents: row.subtotalCents,
    shippingCents: row.shippingCents,
    taxCents: row.taxCents,
    totalCents: row.totalCents,
    shippingAddress: row.shippingAddress as unknown as ShippingAddress,
    placedAt: row.createdAt.toISOString(),
    items: row.items.map(toOrderLineItem),
    itemCount: row.items.reduce((count, item) => count + item.quantity, 0),
  };
}

function generateOrderNumber(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';

  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[randomInt(alphabet.length)];
  }

  return `TL-${suffix}`;
}

export interface PlaceOrderInput {
  readonly userId: string;
  readonly shippingAddress: ShippingAddress;
}

export async function placeOrder(input: PlaceOrderInput): Promise<OrderDetail> {
  return db.$transaction(
    async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId: input.userId },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, slug: true, basePriceCents: true, status: true },
              },
              variant: {
                select: {
                  id: true,
                  size: true,
                  color: true,
                  sku: true,
                  priceOverrideCents: true,
                  images: {
                    select: { url: true },
                    orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new ValidationError('Your cart is empty.');
      }

      const unavailable = cart.items.find((item) => item.product.status !== 'ACTIVE');

      if (unavailable) {
        throw new ConflictError(
          `"${unavailable.product.name}" is no longer available. Please remove it to continue.`,
        );
      }

      for (const item of cart.items) {
        const reserved = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (reserved.count === 0) {
          const current = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { stock: true },
          });

          throw new InsufficientStockError(item.product.name, current?.stock ?? 0);
        }
      }

      const lines = cart.items.map((item) => ({
        unitPriceCents: item.variant.priceOverrideCents ?? item.product.basePriceCents,
        quantity: item.quantity,
      }));

      const totals = calculateTotals(lines);

      const order = await createOrderWithUniqueNumber(tx, {
        userId: input.userId,
        totals,
        shippingAddress: input.shippingAddress,
        items: cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          productSlug: item.product.slug,
          variantSize: item.variant.size,
          variantColor: item.variant.color,
          sku: item.variant.sku,
          imageUrl: item.variant.images[0]?.url ?? null,
          unitPriceCents: item.variant.priceOverrideCents ?? item.product.basePriceCents,
          quantity: item.quantity,
        })),
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return toOrderDetail(order);
    },
    {
      timeout: 15_000,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
}

interface CreateOrderData {
  readonly userId: string;
  readonly totals: ReturnType<typeof calculateTotals>;
  readonly shippingAddress: ShippingAddress;
  readonly items: readonly {
    readonly productId: string;
    readonly variantId: string | null;
    readonly productName: string;
    readonly productSlug: string;
    readonly variantSize: string | null;
    readonly variantColor: string | null;
    readonly sku: string;
    readonly imageUrl: string | null;
    readonly unitPriceCents: number;
    readonly quantity: number;
  }[];
}

const ORDER_NUMBER_ATTEMPTS = 5;

async function createOrderWithUniqueNumber(
  tx: Prisma.TransactionClient,
  data: CreateOrderData,
): Promise<OrderDetailRow> {
  for (let attempt = 1; attempt <= ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    try {
      return await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: data.userId,
          status: 'PENDING',
          subtotalCents: data.totals.subtotalCents,
          shippingCents: data.totals.shippingCents,
          taxCents: data.totals.taxCents,
          totalCents: data.totals.totalCents,
          shippingAddress: data.shippingAddress as unknown as Prisma.InputJsonValue,
          items: { createMany: { data: [...data.items] } },
        },
        select: orderDetailSelect,
      });
    } catch (error) {
      const isDuplicateOrderNumber =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

      if (!isDuplicateOrderNumber || attempt === ORDER_NUMBER_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw new ConflictError('Could not allocate an order number. Please try again.');
}

export async function listOrders(
  userId: string,
  page: number,
  pageSize: number,
): Promise<Paginated<OrderSummary>> {
  const where = { userId } satisfies Prisma.OrderWhereInput;

  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        createdAt: true,
        items: { select: { quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status as OrderStatusValue,
      totalCents: row.totalCents,
      itemCount: row.items.reduce((count, item) => count + item.quantity, 0),
      placedAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getOrderById(userId: string, orderId: string): Promise<OrderDetail> {
  const row = await db.order.findFirst({
    where: { id: orderId, userId },
    select: orderDetailSelect,
  });

  if (!row) {
    throw new NotFoundError('Order');
  }

  return toOrderDetail(row);
}

export interface AdminOrderQuery {
  readonly status: OrderStatusValue | null;
  readonly search: string | null;
  readonly page: number;
  readonly pageSize: number;
}

export async function listAllOrders(query: AdminOrderQuery): Promise<Paginated<AdminOrderRow>> {
  const conditions: Prisma.OrderWhereInput[] = [];

  if (query.status) {
    conditions.push({ status: query.status });
  }

  if (query.search) {
    conditions.push({
      OR: [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ],
    });
  }

  const where: Prisma.OrderWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        createdAt: true,
        user: { select: { email: true, name: true } },
        items: { select: { quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.order.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status as OrderStatusValue,
      totalCents: row.totalCents,
      itemCount: row.items.reduce((count, item) => count + item.quantity, 0),
      placedAt: row.createdAt.toISOString(),
      customerEmail: row.user.email,
      customerName: row.user.name,
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getOrderForAdmin(orderId: string): Promise<OrderDetail> {
  const row = await db.order.findUnique({ where: { id: orderId }, select: orderDetailSelect });

  if (!row) {
    throw new NotFoundError('Order');
  }

  return toOrderDetail(row);
}

export async function attachPaymentReference(
  orderId: string,
  payment: { provider: string; method: string | null; reference: string },
): Promise<void> {
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentProvider: payment.provider,
      paymentMethod: payment.method,
      paymentReference: payment.reference,
    },
  });
}

export async function markOrderPaid(reference: string): Promise<boolean> {
  const result = await db.order.updateMany({
    where: { paymentReference: reference, status: 'PENDING' },
    data: { status: 'PROCESSING', paidAt: new Date() },
  });

  return result.count > 0;
}

export async function confirmPendingPayment(userId: string, orderId: string): Promise<boolean> {
  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    select: { status: true, paymentReference: true, paymentProvider: true },
  });

  if (!order || order.status !== 'PENDING' || !order.paymentReference) {
    return false;
  }

  const plugin = getPaymentPlugin();

  if (plugin.id !== order.paymentProvider) {
    return false;
  }

  try {
    const status = await plugin.getStatus(order.paymentReference);

    if (status !== 'paid') {
      return false;
    }
  } catch (error) {
    console.error('[orderService] Could not confirm payment on return:', error);
    return false;
  }

  return markOrderPaid(order.paymentReference);
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatusValue,
): Promise<OrderDetail> {
  const existing = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!existing) {
    throw new NotFoundError('Order');
  }

  const current = existing.status as OrderStatusValue;

  if (current === nextStatus) {
    return getOrderForAdmin(orderId);
  }

  if (!canTransition(current, nextStatus)) {
    throw new ValidationError(
      `An order cannot move from ${current.toLowerCase()} to ${nextStatus.toLowerCase()}.`,
    );
  }

  const updated = await db.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
    select: orderDetailSelect,
  });

  return toOrderDetail(updated);
}
