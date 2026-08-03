import 'server-only';
import { manualPaymentPlugin } from './manual';
import type { PaymentPlugin, PaymentProviderId } from './types';

const REGISTRY: Partial<Record<PaymentProviderId, PaymentPlugin>> = {
  manual: manualPaymentPlugin,
};

export function getPaymentPlugin(): PaymentPlugin {
  const configured = (process.env.PAYMENT_PROVIDER ?? 'manual') as PaymentProviderId;
  const plugin = REGISTRY[configured];

  if (!plugin?.isEnabled()) {
    throw new Error(
      `Payment provider "${configured}" is not available. Implemented providers: ${Object.keys(REGISTRY).join(', ')}.`,
    );
  }

  return plugin;
}
