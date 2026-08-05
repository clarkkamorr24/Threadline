'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';
import type { Cart } from '@/entities/cart/model/types';
import { requireShopper } from '@/lib/auth/session';
import { createAction } from '@/lib/serverAction';
import {
  addItemToCart,
  clearCart,
  removeCartItem,
  updateCartItemQuantity,
} from '@/services/cartService';
import { addToCartSchema, removeCartItemSchema, updateCartItemSchema } from '../model/schema';


function revalidateCartViews(): void {
  revalidatePath(ROUTES.cart);
  revalidatePath('/', 'layout');
}

export const addToCartAction = createAction(
  'cart.add',
  addToCartSchema,
  async (input): Promise<Cart> => {
    const user = await requireShopper();
    const cart = await addItemToCart(user.id, input.variantId, input.quantity);
    revalidateCartViews();
    return cart;
  },
);

export const updateCartItemAction = createAction(
  'cart.update',
  updateCartItemSchema,
  async (input): Promise<Cart> => {
    const user = await requireShopper();
    const cart = await updateCartItemQuantity(user.id, input.cartItemId, input.quantity);
    revalidateCartViews();
    return cart;
  },
);

export const removeCartItemAction = createAction(
  'cart.remove',
  removeCartItemSchema,
  async (input): Promise<Cart> => {
    const user = await requireShopper();
    const cart = await removeCartItem(user.id, input.cartItemId);
    revalidateCartViews();
    return cart;
  },
);

export const clearCartAction = createAction(
  'cart.clear',
  z.void(),
  async (): Promise<Cart> => {
    const user = await requireShopper();
    const cart = await clearCart(user.id);
    revalidateCartViews();
    return cart;
  },
);
