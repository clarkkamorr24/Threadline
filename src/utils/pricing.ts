import {
  BASIS_POINTS_DIVISOR,
  FLAT_SHIPPING_RATE_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  TAX_RATE_BASIS_POINTS,
} from '@/constants/catalog';
import type { CartTotals } from '@/entities/cart/model/types';

export interface PriceableLine {
  readonly unitPriceCents: number;
  readonly quantity: number;
}

export function calculateSubtotalCents(lines: readonly PriceableLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
}

export function calculateShippingCents(subtotalCents: number): number {
  if (subtotalCents <= 0) {
    return 0;
  }

  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_RATE_CENTS;
}

export function calculateTaxCents(subtotalCents: number): number {
  return Math.round((subtotalCents * TAX_RATE_BASIS_POINTS) / BASIS_POINTS_DIVISOR);
}

export function calculateTotals(
  lines: readonly PriceableLine[],
  currency = 'USD',
): CartTotals {
  const subtotalCents = calculateSubtotalCents(lines);
  const shippingCents = calculateShippingCents(subtotalCents);
  const taxCents = calculateTaxCents(subtotalCents);

  const remaining = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;

  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
    currency,
    freeShippingRemainingCents: subtotalCents > 0 && remaining > 0 ? remaining : null,
  };
}
