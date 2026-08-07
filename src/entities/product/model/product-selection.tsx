'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface ProductSelectionValue {
  readonly selectedColor: string | null;
  readonly selectedSize: string | null;
  readonly selectColor: (color: string) => void;
  readonly selectSize: (size: string) => void;
}

const ProductSelectionContext = createContext<ProductSelectionValue | null>(null);

interface ProductSelectionProviderProps {
  readonly initialColor: string | null;
  readonly initialSize: string | null;
  readonly children: ReactNode;
}

export function ProductSelectionProvider({
  initialColor,
  initialSize,
  children,
}: ProductSelectionProviderProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor);
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize);

  const value = useMemo<ProductSelectionValue>(
    () => ({
      selectedColor,
      selectedSize,
      selectColor: setSelectedColor,
      selectSize: setSelectedSize,
    }),
    [selectedColor, selectedSize],
  );

  return (
    <ProductSelectionContext.Provider value={value}>{children}</ProductSelectionContext.Provider>
  );
}

export function useProductSelection(): ProductSelectionValue {
  const context = useContext(ProductSelectionContext);

  if (!context) {
    throw new Error('useProductSelection must be used inside a ProductSelectionProvider.');
  }

  return context;
}
