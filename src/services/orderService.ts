import 'server-only';
import { randomInt } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client';
import type {
  OrderDetail,
  OrderLineItem,
  OrderStatusValue,
  ShippingAddress,
} from '@/entities/order/model/types';
import type { OrderSummary } from '@/entities/order/model/types';
import type { Paginated } from '@/entities/product/model/types';
import { db } from '@/lib/db';
import { ConflictError, InsufficientStockError, NotFoundError, ValidationError } from '@/lib/errors';
import { calculateTotals } from '@/utils/pricing';


const orderDetailSelect = {
  id: true,
  orderNumber: true,
  status: true,
  currency: true,
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
      productName: true,
      productSlug: true,
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
    productName: row.productName,
    productSlug: row.productSlug,
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
    currency: row.currency,
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
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  priceCents: true,
                  currency: true,
                  status: true,
                  images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
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
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (count === 0) {
          const current = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true },
          });

          throw new InsufficientStockError(item.product.name, current?.stock ?? 0);
        }
      }

      const lines = cart.items.map((item) => ({
        unitPriceCents: item.product.priceCents,
        quantity: item.quantity,
      }));

      const currency = cart.items[0]?.product.currency ?? 'USD';
      const totals = calculateTotals(lines, currency);

      const order = await createOrderWithUniqueNumber(tx, {
        userId: input.userId,
        currency,
        totals,
        shippingAddress: input.shippingAddress,
        items: cart.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productSlug: item.product.slug,
          imageUrl: item.product.images[0]?.url ?? null,
          unitPriceCents: item.product.priceCents,
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
  readonly currency: string;
  readonly totals: ReturnType<typeof calculateTotals>;
  readonly shippingAddress: ShippingAddress;
  readonly items: readonly {
    readonly productId: string;
    readonly productName: string;
    readonly productSlug: string;
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
          status: 'PAID',
          currency: data.currency,
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

  const [rows, total] = await db.$transaction([
    db.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
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
      currency: row.currency,
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
