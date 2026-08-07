import { z } from 'zod';
import { MAX_VARIANTS, MAX_VARIANT_IMAGES } from '@/constants/catalog';
import { PRODUCT_STATUSES } from '@/entities/product/model/types';
import { toCents } from '@/utils/money';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const priceField = z
  .number({ invalid_type_error: 'Enter a valid price.' })
  .nonnegative('Price cannot be negative.')
  .max(1_000_000, 'Price is unrealistically high.');

export const variantImageSchema = z.object({
  url: z.string().url('Each image must be a valid URL.'),
  alt: z.string().max(160).nullish(),
  storageKey: z.string().nullish(),
});

export const variantSchema = z.object({
  id: z.string().nullish(),
  size: z.string().trim().min(1, 'Size is required.').max(30),
  color: z.string().trim().min(1, 'Colour is required.').max(40),
  sku: z
    .string()
    .trim()
    .min(1, 'Each variant needs a SKU.')
    .max(60)
    .transform((value) => value.toUpperCase()),
  stock: z
    .number({ invalid_type_error: 'Enter a stock quantity.' })
    .int()
    .min(0, 'Stock cannot be negative.')
    .max(1_000_000),
  priceOverride: priceField.nullish(),
  images: z
    .array(variantImageSchema)
    .min(1, 'Each variant needs at least one image.')
    .max(MAX_VARIANT_IMAGES, `At most ${MAX_VARIANT_IMAGES} images per variant.`),
});

const baseProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(140, 'Name must be 140 characters or fewer.'),
  slug: z
    .string()
    .min(1, 'Slug is required.')
    .max(140)
    .regex(slugPattern, 'Use lowercase letters, numbers and hyphens only.'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(5_000, 'Description must be 5000 characters or fewer.'),
  material: z
    .string()
    .max(200, 'Material must be 200 characters or fewer.')
    .nullable()
    .default(null)
    .transform((value) => value?.trim() || null),
  basePrice: priceField,
  status: z.enum(PRODUCT_STATUSES),
  featured: z.boolean().default(false),
  categoryId: z.string().min(1, 'Choose a category.'),
  variants: z
    .array(variantSchema)
    .min(1, 'A product needs at least one variant.')
    .max(MAX_VARIANTS, `At most ${MAX_VARIANTS} variants.`)
    .superRefine((variants, ctx) => {
      const seenSku = new Set<string>();
      const seenCombo = new Set<string>();

      variants.forEach((variant, index) => {
        if (seenSku.has(variant.sku)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, 'sku'],
            message: 'Duplicate SKU.',
          });
        }
        seenSku.add(variant.sku);

        const combo = `${variant.size ?? ''}|${variant.color ?? ''}`;
        if (seenCombo.has(combo)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, 'color'],
            message: 'Duplicate size and colour combination.',
          });
        }
        seenCombo.add(combo);
      });
    }),
});

export const productDetailsSchema = baseProductSchema.omit({ variants: true });
export type ProductDetailsInput = z.infer<typeof productDetailsSchema>;

export interface VariantIssue {
  readonly index: number;
  readonly field: 'sku' | 'size' | 'color' | 'stock' | 'images';
  readonly message: string;
}

export function validateVariants(
  variants: readonly {
    size: string | null;
    color: string | null;
    sku: string;
    stock: number;
    images: readonly unknown[];
  }[],
): readonly VariantIssue[] {
  const issues: VariantIssue[] = [];
  const seenSku = new Map<string, number>();
  const seenCombo = new Map<string, number>();

  variants.forEach((variant, index) => {
    const sku = variant.sku.trim().toUpperCase();

    if (!variant.size?.trim()) {
      issues.push({ index, field: 'size', message: 'Size is required.' });
    }

    if (!variant.color?.trim()) {
      issues.push({ index, field: 'color', message: 'Colour is required.' });
    }

    if (variant.images.length === 0) {
      issues.push({ index, field: 'images', message: 'Add at least one image.' });
    }

    if (!sku) {
      issues.push({ index, field: 'sku', message: 'SKU is required.' });
    } else if (seenSku.has(sku)) {
      issues.push({
        index,
        field: 'sku',
        message: `Duplicate SKU (also on variant ${(seenSku.get(sku) ?? 0) + 1}).`,
      });
    } else {
      seenSku.set(sku, index);
    }

    if (!Number.isFinite(variant.stock) || variant.stock < 0) {
      issues.push({ index, field: 'stock', message: 'Enter a stock quantity of 0 or more.' });
    }

    const combo = `${variant.size ?? ''}|${variant.color ?? ''}`;

    if (seenCombo.has(combo)) {
      issues.push({
        index,
        field: 'color',
        message: `Same size and colour as variant ${(seenCombo.get(combo) ?? 0) + 1}.`,
      });
    } else {
      seenCombo.set(combo, index);
    }
  });

  return issues;
}

export const createProductSchema = baseProductSchema;
export const updateProductSchema = baseProductSchema.extend({ id: z.string().min(1) });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export interface ProductWriteModel {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly material: string | null;
  readonly basePriceCents: number;
  readonly status: (typeof PRODUCT_STATUSES)[number];
  readonly featured: boolean;
  readonly categoryId: string;
  readonly variants: readonly {
    id: string | null;
    size: string;
    color: string;
    sku: string;
    stock: number;
    priceOverrideCents: number | null;
    images: readonly { url: string; alt: string | null; storageKey: string | null }[];
  }[];
}

export function toProductWriteModel(input: CreateProductInput): ProductWriteModel {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    material: input.material,
    basePriceCents: toCents(input.basePrice),
    status: input.status,
    featured: input.featured,
    categoryId: input.categoryId,
    variants: input.variants.map((variant) => ({
      id: variant.id ?? null,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock: variant.stock,
      priceOverrideCents:
        variant.priceOverride === null || variant.priceOverride === undefined
          ? null
          : toCents(variant.priceOverride),
      images: variant.images.map((image) => ({
        url: image.url,
        alt: image.alt ?? null,
        storageKey: image.storageKey ?? null,
      })),
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
