'use client';

import { useMemo } from 'react';
import { useProductSelection } from '@/entities/product/model/product-selection';
import type { ProductVariantModel } from '@/entities/product/model/types';
import { distinctImages, pickGalleryVariant } from '../model/gallery-images';
import { ProductGallery } from './product-gallery';

interface VariantGalleryProps {
  readonly variants: readonly ProductVariantModel[];
  readonly productName: string;
}

export function VariantGallery({ variants, productName }: VariantGalleryProps) {
  const { selectedColor, selectedSize } = useProductSelection();

  const images = useMemo(
    () => distinctImages(variants.flatMap((variant) => variant.images)),
    [variants],
  );

  const activeImageUrl = useMemo(() => {
    if (selectedColor === null) {
      return undefined;
    }

    return pickGalleryVariant(variants, selectedColor, selectedSize)?.images[0]?.url;
  }, [variants, selectedColor, selectedSize]);

  return (
    <ProductGallery images={images} productName={productName} activeImageUrl={activeImageUrl} />
  );
}
