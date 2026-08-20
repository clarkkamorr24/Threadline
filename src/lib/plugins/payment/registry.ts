import 'server-only';
import { stripePaymentPlugin } from './stripe';
import type { PaymentPlugin } from './types';

export function getPaymentPlugin(): PaymentPlugin {
  if (!stripePaymentPlugin.isEnabled()) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY to accept payments.');
  }

  return stripePaymentPlugin;
}
