import type { OrderStatusValue } from '@/entities/order/model/types';

export const PAYMENT_PROVIDER_IDS = ['stripe'] as const;

export type PaymentProviderId = (typeof PAYMENT_PROVIDER_IDS)[number];

export const PAYMENT_METHOD_IDS = ['card'] as const;

export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number];

export interface PaymentMethodOption {
  readonly id: PaymentMethodId;
  readonly label: string;
  readonly logoSrc: string;
}

export interface PaymentLineItem {
  readonly name: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly unitPriceCents: number;
  readonly quantity: number;
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
  readonly items: readonly PaymentLineItem[];
  readonly shippingCents: number;
  readonly taxCents: number;
}

export interface PaymentIntent {
  readonly providerId: PaymentProviderId;
  readonly reference: string;
  readonly requiresAction: boolean;
  readonly redirectUrl: string | null;
  readonly initialOrderStatus: OrderStatusValue;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface PaymentResolution {
  readonly status: PaymentStatus;
  readonly method: string | null;
}

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
  getStatus(reference: string): Promise<PaymentResolution>;
  parseWebhook(rawBody: string, signatureHeader: string | null): PaymentWebhookEvent | null;
}
