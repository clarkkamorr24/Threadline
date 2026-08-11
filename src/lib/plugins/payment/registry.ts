import 'server-only';
import { manualPaymentPlugin } from './manual';
import { paymongoPaymentPlugin } from './paymongo';
import type { PaymentPlugin, PaymentProviderId } from './types';

const REGISTRY: Partial<Record<PaymentProviderId, PaymentPlugin>> = {
  manual: manualPaymentPlugin,
  paymongo: paymongoPaymentPlugin,
};

export function getPaymentPlugin(): PaymentPlugin {
  const configured = (process.env.PAYMENT_PROVIDER ?? 'manual') as PaymentProviderId;
  const plugin = REGISTRY[configured];

  if (!plugin) {
    throw new Error(
      `Payment provider "${configured}" is not implemented. Available: ${Object.keys(REGISTRY).join(', ')}.`,
    );
  }

  if (!plugin.isEnabled()) {
    throw new Error(
      `Payment provider "${configured}" is selected but not configured. Set its API keys.`,
    );
  }

  return plugin;
}
