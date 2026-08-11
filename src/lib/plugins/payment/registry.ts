import 'server-only';
import { paymongoPaymentPlugin } from './paymongo';
import type { PaymentPlugin } from './types';

export function getPaymentPlugin(): PaymentPlugin {
  if (!paymongoPaymentPlugin.isEnabled()) {
    throw new Error(
      'PayMongo is not configured. Set PAYMONGO_SECRET_KEY to accept payments.',
    );
  }

  return paymongoPaymentPlugin;
}
