import 'server-only';
import Stripe from 'stripe';
import { PaymentError } from '@/lib/errors';
import type {
  PaymentIntent,
  PaymentIntentInput,
  PaymentMethodOption,
  PaymentPlugin,
  PaymentResolution,
  PaymentStatus,
  PaymentWebhookEvent,
} from './types';

const METHODS: readonly PaymentMethodOption[] = [
  { id: 'card', label: 'Card', logoSrc: '/payments/stripe.svg' },
];

// Stripe renders line-item images from the URL, so a relative path or a
// localhost URL shows nothing on the hosted page.
function toDisplayableImage(url: string | null): string | undefined {
  return url && /^https:\/\//i.test(url) ? url : undefined;
}

function buildLineItems(input: PaymentIntentInput): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const currency = input.currency.toLowerCase();

  const lines: Stripe.Checkout.SessionCreateParams.LineItem[] = input.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency,
      unit_amount: item.unitPriceCents,
      product_data: {
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(toDisplayableImage(item.imageUrl)
          ? { images: [toDisplayableImage(item.imageUrl) as string] }
          : {}),
      },
    },
  }));

  for (const [label, amount] of [
    ['Shipping', input.shippingCents],
    ['Tax', input.taxCents],
  ] as const) {
    if (amount > 0) {
      lines.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: { name: label },
        },
      });
    }
  }

  return lines;
}

function sumOf(lines: readonly Stripe.Checkout.SessionCreateParams.LineItem[]): number {
  return lines.reduce(
    (total, line) => total + (line.price_data?.unit_amount ?? 0) * (line.quantity ?? 1),
    0,
  );
}

function resolveLineItems(
  input: PaymentIntentInput,
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const itemised = buildLineItems(input);
  const total = sumOf(itemised);

  if (itemised.length > 0 && itemised.length <= MAX_LINE_ITEMS && total === input.amountCents) {
    return itemised;
  }

  if (itemised.length > 0) {
    console.warn(
      '[payment:stripe] Falling back to a single line item for',
      input.orderReference,
      `(lines=${itemised.length}, sum=${total}, expected=${input.amountCents})`,
    );
  }

  return [
    {
      quantity: 1,
      price_data: {
        currency: input.currency.toLowerCase(),
        unit_amount: input.amountCents,
        product_data: { name: `Threadline order ${input.orderReference}` },
      },
    },
  ];
}

const MAX_LINE_ITEMS = 100;

function readChargedMethod(session: Stripe.Checkout.Session): string | null {
  const intent = session.payment_intent;

  if (!intent || typeof intent === 'string') {
    return null;
  }

  const method = intent.payment_method;

  if (!method || typeof method === 'string') {
    return null;
  }

  return method.card?.brand ?? method.type ?? null;
}

let cachedClient: Stripe | null = null;
let warnedAboutLiveKey = false;

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new PaymentError('Stripe is not configured. Set STRIPE_SECRET_KEY.');
  }

  if (key.startsWith('sk_live_') && process.env.NODE_ENV !== 'production' && !warnedAboutLiveKey) {
    warnedAboutLiveKey = true;
    console.warn(
      '[payment:stripe] A LIVE secret key is in use outside production. Real money can move.',
    );
  }

  return key;
}

function getClient(): Stripe {
  cachedClient ??= new Stripe(getSecretKey(), { typescript: true });

  return cachedClient;
}

function toPaymentError(error: unknown, fallback: string): PaymentError {
  if (error instanceof Stripe.errors.StripeError) {
    console.error('[payment:stripe]', error.type, error.message);

    return new PaymentError(error.message || fallback);
  }

  console.error('[payment:stripe] Unexpected failure:', error);

  return new PaymentError(fallback);
}

export const stripePaymentPlugin: PaymentPlugin = {
  id: 'stripe',
  label: 'Stripe',

  isEnabled(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  },

  availableMethods(): readonly PaymentMethodOption[] {
    return METHODS;
  },

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntent> {
    try {
      const session = await getClient().checkout.sessions.create({
        mode: 'payment',
        line_items: resolveLineItems(input),
        customer_email: input.customerEmail,
        client_reference_id: input.orderReference,
        metadata: { orderReference: input.orderReference },
        success_url: input.returnUrl,
        cancel_url: input.returnUrl,
      });

      if (!session.url) {
        throw new PaymentError('Stripe did not return a checkout URL.');
      }

      return {
        providerId: 'stripe',
        reference: session.id,
        requiresAction: true,
        redirectUrl: session.url,
        initialOrderStatus: 'PENDING',
      };
    } catch (error) {
      throw toPaymentError(error, 'Could not start the payment. Please try again.');
    }
  },

  async getStatus(reference: string): Promise<PaymentResolution> {
    try {
      const session = await getClient().checkout.sessions.retrieve(reference, {
        expand: ['payment_intent.payment_method'],
      });
      console.log("session", session)
      const status: PaymentStatus =
        session.payment_status === 'paid'
          ? 'paid'
          : session.status === 'expired'
            ? 'failed'
            : 'pending';

      return { status, method: readChargedMethod(session) };
    } catch (error) {
      throw toPaymentError(error, 'Could not read the payment status.');
    }
  },

  async resumeIntent(reference: string): Promise<string | null> {
    try {
      const session = await getClient().checkout.sessions.retrieve(reference);

      return session.status === 'open' ? (session.url ?? null) : null;
    } catch (error) {
      console.warn('[payment:stripe] Could not resume session', reference, error);
      return null;
    }
  },

  async cancelIntent(reference: string): Promise<void> {
    try {
      const session = await getClient().checkout.sessions.retrieve(reference);

      if (session.status === 'open') {
        await getClient().checkout.sessions.expire(reference);
      }
    } catch (error) {
      console.warn('[payment:stripe] Could not expire session', reference, error);
    }
  },

  parseWebhook(rawBody: string, signatureHeader: string | null): PaymentWebhookEvent | null {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[payment:stripe] STRIPE_WEBHOOK_SECRET is not set; rejecting webhook.');
      return null;
    }

    if (!signatureHeader) {
      return null;
    }

    let event: Stripe.Event;

    try {
      event = getClient().webhooks.constructEvent(rawBody, signatureHeader, secret);
    } catch (error) {
      console.error(
        '[payment:stripe] Webhook signature rejected:',
        error instanceof Error ? error.message : error,
      );
      return null;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      return session.payment_status === 'paid'
        ? { reference: session.id, status: 'paid' }
        : { reference: session.id, status: 'pending' };
    }

    if (event.type === 'checkout.session.async_payment_succeeded') {
      return { reference: event.data.object.id, status: 'paid' };
    }

    if (
      event.type === 'checkout.session.async_payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
      return { reference: event.data.object.id, status: 'failed' };
    }

    return null;
  },
};
