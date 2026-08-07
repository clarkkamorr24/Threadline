import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { MAX_CART_ITEM_QUANTITY } from '@/constants/catalog';
import type { Cart, CartLineItem } from '@/entities/cart/model/types';
import { EMPTY_CART } from '@/entities/cart/model/types';
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
          basePriceCents: true,
          status: true,
        },
      },
      variant: {
        select: {
          id: true,
          size: true,
          color: true,
          sku: true,
          stock: true,
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
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function toCart(row: CartRow): Cart {
  const items: CartLineItem[] = row.items
    .filter((item) => item.product.status === 'ACTIVE')
    .map((item) => {
      const unitPriceCents = item.variant.priceOverrideCents ?? item.product.basePriceCents;

      return {
        id: item.id,
        productId: item.product.id,
        variantId: item.variant.id,
        name: item.product.name,
        slug: item.product.slug,
        size: item.variant.size,
        color: item.variant.color,
        sku: item.variant.sku,
        imageUrl: item.variant.images[0]?.url ?? null,
        unitPriceCents,
        quantity: item.quantity,
        availableStock: item.variant.stock,
        lineTotalCents: unitPriceCents * item.quantity,
      };
    });

  return {
    id: row.id,
    items,
    totals: calculateTotals(items),
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
  const row = await db.cart.findUnique({ where: { userId }, include: cartInclude });
  return row ? toCart(row) : EMPTY_CART;
}

export async function getCartItemCount(userId: string): Promise<number> {
  const result = await db.cartItem.aggregate({
    where: { cart: { userId }, product: { status: 'ACTIVE' } },
    _sum: { quantity: true },
  });

  return result._sum.quantity ?? 0;
}

export async function getCartVariantQuantities(
  userId: string,
): Promise<Readonly<Record<string, number>>> {
  const items = await db.cartItem.findMany({
    where: { cart: { userId } },
    select: { variantId: true, quantity: true },
  });

  return Object.fromEntries(items.map((item) => [item.variantId, item.quantity]));
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
  variantId: string,
  quantity: number,
): Promise<Cart> {
  assertQuantityInRange(quantity);

  const variant = await db.productVariant.findFirst({
    where: { id: variantId, product: { status: 'ACTIVE' } },
    select: { id: true, stock: true, productId: true, product: { select: { name: true } } },
  });

  if (!variant) {
    throw new NotFoundError('Variant');
  }

  const cartId = await getOrCreateCartId(userId);

  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
    select: { id: true, quantity: true },
  });

  const inCart = existing?.quantity ?? 0;
  const requested = inCart + quantity;
  const ceiling = Math.min(variant.stock, MAX_CART_ITEM_QUANTITY);

  if (requested > ceiling) {
    const remaining = Math.max(0, ceiling - inCart);
    const limit =
      variant.stock <= MAX_CART_ITEM_QUANTITY
        ? `only ${variant.stock} in stock`
        : `a limit of ${MAX_CART_ITEM_QUANTITY} per order`;

    throw new ValidationError(
      inCart > 0
        ? `You already have ${inCart} in your cart and there is ${limit}. You can add ${remaining} more.`
        : `There is ${limit}.`,
    );
  }

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    update: { quantity: requested },
    create: { cartId, variantId, productId: variant.productId, quantity },
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
    select: {
      id: true,
      variant: { select: { stock: true, product: { select: { name: true } } } },
    },
  });

  if (!item) {
    throw new NotFoundError('Cart item');
  }

  if (quantity > item.variant.stock) {
    throw new InsufficientStockError(item.variant.product.name, item.variant.stock);
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
