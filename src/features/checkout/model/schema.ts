import { z } from 'zod';

const requiredText = (label: string, max = 120) =>
  z
    .string()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => value.trim());

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
