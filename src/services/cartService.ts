import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { MAX_CART_ITEM_QUANTITY } from '@/constants/catalog';
import type { Cart, CartLineItem } from '@/entities/cart/model/types';
import { EMPTY_CART_TOTALS } from '@/entities/cart/model/types';
import { db } from '@/lib/db';
import { InsufficientStockError, NotFoundError, ValidationError } from '@/lib/errors';
import { calculateTotals } from '@/utils/pricing';

const cartInclude = {
  items: {
    orderBy: { createdAt: 'asc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          priceCents: true,
          currency: true,
          stock: true,
          status: true,
          images: {
            select: { url: true },
            orderBy: { position: 'asc' },
            take: 1,
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function toCart(row: CartRow): Cart {
  const items: CartLineItem[] = row.items
    .filter((item) => item.product.status === 'ACTIVE')
    .map((item) => ({
      id: item.id,
      productId: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      imageUrl: item.product.images[0]?.url ?? null,
      unitPriceCents: item.product.priceCents,
      currency: item.product.currency,
      quantity: item.quantity,
      availableStock: item.product.stock,
      lineTotalCents: item.product.priceCents * item.quantity,
    }));

  const currency = items[0]?.currency ?? EMPTY_CART_TOTALS.currency;

  return {
    id: row.id,
    items,
    totals: calculateTotals(items, currency),
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    hasStockIssues: items.some((item) => item.quantity > item.availableStock),
  };
}

async function getOrCreateCartId(userId: string): Promise<string> {
  const cart = await db.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });

  return cart.id;
}

export async function getCart(userId: string): Promise<Cart> {
  const row = await db.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });

  if (!row) {
    return {
      id: '',
      items: [],
      totals: EMPTY_CART_TOTALS,
      itemCount: 0,
      hasStockIssues: false,
    };
  }

  return toCart(row);
}

export async function getCartItemCount(userId: string): Promise<number> {
  const result = await db.cartItem.aggregate({
    where: { cart: { userId }, product: { status: 'ACTIVE' } },
    _sum: { quantity: true },
  });

  return result._sum.quantity ?? 0;
}

function assertQuantityInRange(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError('Quantity must be a whole number of at least 1.');
  }

  if (quantity > MAX_CART_ITEM_QUANTITY) {
    throw new ValidationError(`You can order at most ${MAX_CART_ITEM_QUANTITY} of an item.`);
  }
}

export async function addItemToCart(
  userId: string,
  productId: string,
  quantity: number,
): Promise<Cart> {
  assertQuantityInRange(quantity);

  const product = await db.product.findFirst({
    where: { id: productId, status: 'ACTIVE' },
    select: { id: true, name: true, stock: true },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  const cartId = await getOrCreateCartId(userId);

  const existing = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
    select: { quantity: true },
  });

  const requested = (existing?.quantity ?? 0) + quantity;

  if (requested > product.stock) {
    throw new InsufficientStockError(product.name, product.stock);
  }

  if (requested > MAX_CART_ITEM_QUANTITY) {
    throw new ValidationError(`You can order at most ${MAX_CART_ITEM_QUANTITY} of an item.`);
  }

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: requested },
    create: { cartId, productId, quantity },
  });

  return getCart(userId);
}

export async function updateCartItemQuantity(
  userId: string,
  cartItemId: string,
  quantity: number,
): Promise<Cart> {
  assertQuantityInRange(quantity);

  const item = await db.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId } },
    select: { id: true, product: { select: { name: true, stock: true } } },
  });

  if (!item) {
    throw new NotFoundError('Cart item');
  }

  if (quantity > item.product.stock) {
    throw new InsufficientStockError(item.product.name, item.product.stock);
  }

  await db.cartItem.update({ where: { id: item.id }, data: { quantity } });

  return getCart(userId);
}

export async function removeCartItem(userId: string, cartItemId: string): Promise<Cart> {
  const { count } = await db.cartItem.deleteMany({
    where: { id: cartItemId, cart: { userId } },
  });

  if (count === 0) {
    throw new NotFoundError('Cart item');
  }

  return getCart(userId);
}

export async function clearCart(userId: string): Promise<Cart> {
  await db.cartItem.deleteMany({ where: { cart: { userId } } });
  return getCart(userId);
}
