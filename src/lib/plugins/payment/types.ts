import type { OrderStatusValue } from '@/entities/order/model/types';

export const PAYMENT_PROVIDER_IDS = ['manual', 'stripe', 'paypal'] as const;

export type PaymentProviderId = (typeof PAYMENT_PROVIDER_IDS)[number];

export interface PaymentIntentInput {
  readonly orderReference: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly customerEmail: string;
  readonly returnUrl: string;
}

export interface PaymentIntent {
  readonly providerId: PaymentProviderId;
  readonly reference: string;
  readonly requiresAction: boolean;
  readonly redirectUrl: string | null;
  readonly initialOrderStatus: OrderStatusValue;
}

export interface PaymentPlugin {
  readonly id: PaymentProviderId;
  readonly label: string;
  isEnabled(): boolean;
  createIntent(input: PaymentIntentInput): Promise<PaymentIntent>;
}
