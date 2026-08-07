import type { ProductImageModel, ProductVariantModel } from '@/entities/product/model/types';

export function pickGalleryVariant(
  variants: readonly ProductVariantModel[],
  color: string | null,
  size: string | null,
): ProductVariantModel | null {
  const exact = variants.find(
    (variant) =>
      (color === null || variant.color === color) && (size === null || variant.size === size),
  );

  if (exact) {
    return exact;
  }

  const byColor = variants.find((variant) => color === null || variant.color === color);

  return byColor ?? variants[0] ?? null;
}

export function distinctImages(
  images: readonly ProductImageModel[],
): readonly ProductImageModel[] {
  const seen = new Set<string>();

  return images.filter((image) => {
    if (seen.has(image.url)) {
      return false;
    }

    seen.add(image.url);
    return true;
  });
}
