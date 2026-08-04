import { z } from 'zod';
import { MAX_PRODUCT_IMAGES } from '@/constants/catalog';
import { PRODUCT_STATUSES } from '@/entities/product/model/types';
import { toCents } from '@/utils/money';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const priceField = z
  .number({ invalid_type_error: 'Enter a valid price.' })
  .nonnegative('Price cannot be negative.')
  .max(1_000_000, 'Price is unrealistically high.');

export const productImageSchema = z.object({
  url: z.string().url('Each image must be a valid URL.'),
  alt: z.string().max(160).optional(),
  storageKey: z.string().nullish(),
});

const baseProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required.')
    .max(140, 'Name must be 140 characters or fewer.')
    .transform((value) => value.trim()),
  slug: z
    .string()
    .min(1, 'Slug is required.')
    .max(140)
    .regex(slugPattern, 'Use lowercase letters, numbers and hyphens only.'),
  description: z
    .string()
    .min(1, 'Description is required.')
    .max(5_000, 'Description must be 5000 characters or fewer.')
    .transform((value) => value.trim()),
  material: z
    .string()
    .max(200, 'Material must be 200 characters or fewer.')
    .transform((value) => value.trim())
    .nullable()
    .default(null),
  basePrice: priceField,
  sku: z
    .string()
    .min(1, 'SKU is required.')
    .max(60)
    .transform((value) => value.trim().toUpperCase()),
  baseStock: z
    .number({ invalid_type_error: 'Enter a stock quantity.' })
    .int('Stock must be a whole number.')
    .min(0, 'Stock cannot be negative.')
    .max(1_000_000),
  status: z.enum(PRODUCT_STATUSES),
  featured: z.boolean().default(false),
  categoryId: z.string().min(1, 'Choose a category.'),
  images: z
    .array(productImageSchema)
    .max(MAX_PRODUCT_IMAGES, `At most ${MAX_PRODUCT_IMAGES} images.`)
    .default([]),
});

export const createProductSchema = baseProductSchema;

export const updateProductSchema = baseProductSchema.extend({ id: z.string().min(1) });

export type CreateProductFormInput = z.input<typeof baseProductSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/** Form values converted to the persistence shape the service expects. */
export interface ProductWriteModel {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly material: string | null;
  readonly basePriceCents: number;
  readonly baseStock: number;
  readonly sku: string;
  readonly status: (typeof PRODUCT_STATUSES)[number];
  readonly featured: boolean;
  readonly categoryId: string;
  readonly images: readonly { url: string; alt: string | null; storageKey: string | null }[];
}

export function toProductWriteModel(input: CreateProductInput): ProductWriteModel {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    material: input.material,
    basePriceCents: toCents(input.basePrice),
    baseStock: input.baseStock,
    sku: input.sku,
    status: input.status,
    featured: input.featured,
    categoryId: input.categoryId,
    images: input.images.map((image) => ({
      url: image.url,
      alt: image.alt ?? null,
      storageKey: image.storageKey ?? null,
    })),
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}
