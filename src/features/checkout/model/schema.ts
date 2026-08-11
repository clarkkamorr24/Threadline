import { z } from 'zod';
import { PAYMENT_METHOD_IDS } from '@/lib/plugins/payment/types';

const requiredText = (label: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .default(null)
    .transform((value) => value?.trim() || null);

export const shippingAddressSchema = z.object({
  fullName: requiredText('Full name', 80),
  line1: requiredText('Address'),
  line2: optionalText(120),
  city: requiredText('City', 80),
  state: optionalText(80),
  postalCode: requiredText('Postal code', 20),
  country: requiredText('Country', 60),
  phone: optionalText(30),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

export const placeOrderSchema = shippingAddressSchema.extend({
  paymentMethod: z.enum(PAYMENT_METHOD_IDS, {
    required_error: 'Choose a payment method.',
    invalid_type_error: 'Choose a payment method.',
  }),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
