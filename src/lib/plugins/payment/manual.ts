import { randomUUID } from 'node:crypto';
import type { PaymentIntent, PaymentPlugin, PaymentStatus } from './types';

export const manualPaymentPlugin: PaymentPlugin = {
  id: 'manual',
  label: 'No payment required',

  isEnabled: () => true,

  availableMethods: () => [],

  createIntent(): Promise<PaymentIntent> {
    return Promise.resolve({
      providerId: 'manual',
      reference: `manual_${randomUUID()}`,
      requiresAction: false,
      redirectUrl: null,
      initialOrderStatus: 'PENDING',
    });
  },

  getStatus(): Promise<PaymentStatus> {
    return Promise.resolve('pending');
  },

  parseWebhook: () => null,
};
