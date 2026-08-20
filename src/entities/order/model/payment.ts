/**
 * Card brands are what the provider reports once a payment succeeds; `card` is
 * the broader choice made at checkout and survives on orders that never got a
 * brand back. gcash and paymaya are retained so orders taken before the move to
 * Stripe still render their real method rather than a raw column value.
 */
export const PAYMENT_METHOD_LABELS: Readonly<Record<string, string>> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  link: 'Link',
  card: 'Card',
  gcash: 'GCash',
  paymaya: 'Maya',
};

export interface PaymentAsset {
  readonly file: string;
  readonly hasWordmark: boolean;
}

export const PAYMENT_ASSETS: Readonly<Record<string, PaymentAsset>> = {
  gcash: { file: 'gcash.svg', hasWordmark: false },
  paymaya: { file: 'maya.svg', hasWordmark: true },
};

export function paymentAsset(method: string | null): PaymentAsset | null {
  return method ? (PAYMENT_ASSETS[method] ?? null) : null;
}

export function paymentMethodLabel(method: string | null, provider: string | null): string | null {
  if (method) {
    return PAYMENT_METHOD_LABELS[method] ?? method.replace(/_/g, ' ');
  }

  return provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : null;
}
