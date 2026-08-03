import { z } from 'zod';
import { MAX_CART_ITEM_QUANTITY } from '@/constants/catalog';

const quantityField = z
  .number()
  .int('Quantity must be a whole number.')
  .min(1, 'Quantity must be at least 1.')
  .max(MAX_CART_ITEM_QUANTITY, `Quantity cannot exceed ${MAX_CART_ITEM_QUANTITY}.`);

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'A product is required.'),
  quantity: quantityField.default(1),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().min(1),
  quantity: quantityField,
});

export const removeCartItemSchema = z.object({
  cartItemId: z.string().min(1),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
