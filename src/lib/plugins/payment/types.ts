import type { OrderStatusValue } from '@/entities/order/model/types';

export const PAYMENT_PROVIDER_IDS = ['paymongo'] as const;

export type PaymentProviderId = (typeof PAYMENT_PROVIDER_IDS)[number];

export const PAYMENT_METHOD_IDS = ['gcash', 'paymaya'] as const;

export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number];

export interface PaymentMethodOption {
  readonly id: PaymentMethodId;
  readonly label: string;
  readonly logoSrc: string;
}

export interface PaymentIntentInput {
  readonly orderReference: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly customerEmail: string;
  readonly customerName: string;
  readonly customerPhone: string | null;
  readonly method: PaymentMethodId | null;
  readonly returnUrl: string;
}

export interface PaymentIntent {
  readonly providerId: PaymentProviderId;
  readonly reference: string;
  readonly requiresAction: boolean;
  readonly redirectUrl: string | null;
  readonly initialOrderStatus: OrderStatusValue;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface PaymentWebhookEvent {
  readonly reference: string;
  readonly status: PaymentStatus;
}

export interface PaymentPlugin {
  readonly id: PaymentProviderId;
  readonly label: string;
  isEnabled(): boolean;
  availableMethods(): readonly PaymentMethodOption[];
  createIntent(input: PaymentIntentInput): Promise<PaymentIntent>;
  getStatus(reference: string): Promise<PaymentStatus>;
  parseWebhook(rawBody: string, signatureHeader: string | null): PaymentWebhookEvent | null;
}
