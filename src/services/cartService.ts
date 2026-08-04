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
    // Stable ordering, otherwise rows shuffle whenever a quantity changes.
    orderBy: { createdAt: 'asc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePriceCents: true,
          baseStock: true,
          sku: true,
          status: true,
          images: {
            select: { url: true },
            orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
            take: 1,
          },
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
          image: { select: { url: true } },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;
type CartItemRow = CartRow['items'][number];

function resolveUnit(item: CartItemRow) {
  if (item.variant) {
    return {
      unitPriceCents: item.variant.priceOverrideCents ?? item.product.basePriceCents,
      availableStock: item.variant.stock,
      sku: item.variant.sku,
      size: item.variant.size,
      color: item.variant.color,
      imageUrl: item.variant.image?.url ?? item.product.images[0]?.url ?? null,
    };
  }

  return {
    unitPriceCents: item.product.basePriceCents,
    availableStock: item.product.baseStock,
    sku: item.product.sku,
    size: null,
    color: null,
    imageUrl: item.product.images[0]?.url ?? null,
  };
}

function toCart(row: CartRow): Cart {
  const items: CartLineItem[] = row.items
    .filter((item) => item.product.status === 'ACTIVE')
    .map((item) => {
      const unit = resolveUnit(item);

      return {
        id: item.id,
        productId: item.product.id,
        variantId: item.variantId,
        name: item.product.name,
        slug: item.product.slug,
        size: unit.size,
        color: unit.color,
        sku: unit.sku,
        imageUrl: unit.imageUrl,
        unitPriceCents: unit.unitPriceCents,
        quantity: item.quantity,
        availableStock: unit.availableStock,
        lineTotalCents: unit.unitPriceCents * item.quantity,
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

function assertQuantityInRange(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError('Quantity must be a whole number of at least 1.');
  }

  if (quantity > MAX_CART_ITEM_QUANTITY) {
    throw new ValidationError(`You can order at most ${MAX_CART_ITEM_QUANTITY} of an item.`);
  }
}

async function resolveRequestedUnit(productId: string, variantId: string | null) {
  const product = await db.product.findFirst({
    where: { id: productId, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      baseStock: true,
      variants: { select: { id: true, stock: true }, take: 1 },
      _count: { select: { variants: true } },
    },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  const hasVariants = product._count.variants > 0;

  if (hasVariants && !variantId) {
    throw new ValidationError('Choose a size and colour before adding to the cart.');
  }

  if (!hasVariants && variantId) {
    throw new ValidationError('That product has no variants to choose from.');
  }

  if (!variantId) {
    return { name: product.name, stock: product.baseStock };
  }

  const variant = await db.productVariant.findFirst({
    where: { id: variantId, productId },
    select: { stock: true },
  });

  if (!variant) {
    throw new NotFoundError('Variant');
  }

  return { name: product.name, stock: variant.stock };
}

export async function addItemToCart(
  userId: string,
  productId: string,
  variantId: string | null,
  quantity: number,
): Promise<Cart> {
  assertQuantityInRange(quantity);

  const unit = await resolveRequestedUnit(productId, variantId);
  const cartId = await getOrCreateCartId(userId);
  const existing = await db.cartItem.findFirst({
    where: { cartId, productId, variantId },
    select: { id: true, quantity: true },
  });

  const requested = (existing?.quantity ?? 0) + quantity;

  if (requested > unit.stock) {
    throw new InsufficientStockError(unit.name, unit.stock);
  }

  if (requested > MAX_CART_ITEM_QUANTITY) {
    throw new ValidationError(`You can order at most ${MAX_CART_ITEM_QUANTITY} of an item.`);
  }

  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { quantity: requested } });
  } else {
    await db.cartItem.create({ data: { cartId, productId, variantId, quantity } });
  }

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
      product: { select: { name: true, baseStock: true } },
      variant: { select: { stock: true } },
    },
  });

  if (!item) {
    throw new NotFoundError('Cart item');
  }

  const available = item.variant ? item.variant.stock : item.product.baseStock;

  if (quantity > available) {
    throw new InsufficientStockError(item.product.name, available);
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
