import { STORE_CURRENCY, STORE_LOCALE } from '@/constants/store';

const MINOR_UNITS_PER_MAJOR = 100;

export function formatMoney(
  cents: number,
  currency: string = STORE_CURRENCY,
  locale: string = STORE_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / MINOR_UNITS_PER_MAJOR);
}

export function toCents(majorUnits: number): number {
  return Math.round(majorUnits * MINOR_UNITS_PER_MAJOR);
}

export function toMajorUnits(cents: number): number {
  return cents / MINOR_UNITS_PER_MAJOR;
}

export function calculateDiscountPercent(
  priceCents: number,
  compareAtCents: number | null,
): number | null {
  if (compareAtCents === null || compareAtCents <= priceCents) {
    return null;
  }

  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}
