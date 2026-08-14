export const PAYMENT_METHOD_LABELS: Readonly<Record<string, string>> = {
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
