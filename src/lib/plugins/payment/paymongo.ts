import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { PaymentError } from '@/lib/errors';
import type {
  PaymentIntent,
  PaymentIntentInput,
  PaymentMethodOption,
  PaymentPlugin,
  PaymentStatus,
  PaymentWebhookEvent,
} from './types';

const API_BASE = 'https://api.paymongo.com/v1';

const METHODS: readonly PaymentMethodOption[] = [
  { id: 'gcash', label: 'GCash', logoSrc: '/payments/gcash.svg' },
  { id: 'paymaya', label: 'Maya', logoSrc: '/payments/maya.svg' },
];

const intentSchema = z.object({
  data: z.object({
    id: z.string(),
    attributes: z.object({
      status: z.string(),
      next_action: z
        .object({ type: z.string(), redirect: z.object({ url: z.string().url() }).optional() })
        .nullish(),
      last_payment_error: z.unknown().nullish(),
    }),
  }),
});

const methodSchema = z.object({ data: z.object({ id: z.string() }) });

const webhookSchema = z.object({
  data: z.object({
    attributes: z.object({
      type: z.string(),
      data: z.object({
        attributes: z.object({
          payment_intent_id: z.string().nullish(),
          status: z.string().nullish(),
        }),
      }),
    }),
  }),
});

const apiErrorSchema = z.object({
  errors: z.array(z.object({ code: z.string().nullish(), detail: z.string().nullish() })),
});

function describeApiError(payload: unknown): string | null {
  const parsed = apiErrorSchema.safeParse(payload);

  if (!parsed.success) {
    return null;
  }

  const details = parsed.data.errors
    .map((issue) => issue.detail ?? issue.code)
    .filter((value): value is string => Boolean(value));

  return details.length > 0 ? details.join('; ') : null;
}

let warnedAboutLiveKey = false;

function getSecretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;

  if (!key) {
    throw new PaymentError('PAYMONGO_SECRET_KEY is not set.');
  }

  if (key.startsWith('sk_live_') && process.env.NODE_ENV !== 'production' && !warnedAboutLiveKey) {
    warnedAboutLiveKey = true;
    console.warn(
      '[payment:paymongo] A LIVE secret key is in use outside production. ' +
        'Completed payments will move real money. Use an sk_test_ key for development.',
    );
  }

  return key;
}

async function callApi<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  body?: unknown,
): Promise<z.infer<T>> {
  const auth = Buffer.from(`${getSecretKey()}:`).toString('base64');

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        authorization: `Basic ${auth}`,
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (cause) {
    console.error('[payment:paymongo] Network failure calling', path, cause);
    throw new PaymentError('Could not reach the payment provider. Please try again.');
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    console.error('[payment:paymongo] API error', response.status, JSON.stringify(payload));

    const detail = describeApiError(payload);

    throw new PaymentError(
      detail
        ? `The payment provider rejected the request: ${detail}`
        : 'The payment provider rejected the request.',
    );
  }

  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    console.error('[payment:paymongo] Unexpected response shape for', path, parsed.error.issues);
    throw new PaymentError('The payment provider returned an unexpected response.');
  }

  return parsed.data;
}

function toPaymentStatus(status: string): PaymentStatus {
  if (status === 'succeeded' || status === 'paid') {
    return 'paid';
  }

  if (status === 'failed' || status === 'cancelled') {
    return 'failed';
  }

  return 'pending';
}

export const paymongoPaymentPlugin: PaymentPlugin = {
  id: 'paymongo',
  label: 'GCash / Maya',

  isEnabled: () => Boolean(process.env.PAYMONGO_SECRET_KEY),

  availableMethods: () => METHODS,

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntent> {
    if (!input.method) {
      throw new PaymentError('Choose a payment method.');
    }

    const intent = await callApi('/payment_intents', intentSchema, {
      data: {
        attributes: {
          amount: input.amountCents,
          currency: input.currency,
          payment_method_allowed: [input.method],
          capture_type: 'automatic',
          description: `Order ${input.orderReference}`,
        },
      },
    });

    const method = await callApi('/payment_methods', methodSchema, {
      data: {
        attributes: {
          type: input.method,
          billing: {
            name: input.customerName,
            email: input.customerEmail,
            ...(input.customerPhone ? { phone: input.customerPhone } : {}),
          },
        },
      },
    });

    const attached = await callApi(
      `/payment_intents/${intent.data.id}/attach`,
      intentSchema,
      {
        data: {
          attributes: {
            payment_method: method.data.id,
            return_url: input.returnUrl,
          },
        },
      },
    );

    const redirectUrl = attached.data.attributes.next_action?.redirect?.url ?? null;

    if (!redirectUrl) {
      console.error(
        '[payment:paymongo] No redirect returned; status was',
        attached.data.attributes.status,
      );
      throw new PaymentError('The payment provider did not return a checkout link.');
    }

    return {
      providerId: 'paymongo',
      reference: intent.data.id,
      requiresAction: true,
      redirectUrl,
      initialOrderStatus: 'PENDING',
    };
  },

  async getStatus(reference: string): Promise<PaymentStatus> {
    const intent = await callApi(`/payment_intents/${reference}`, intentSchema);

    return toPaymentStatus(intent.data.attributes.status);
  },

  parseWebhook(rawBody: string, signatureHeader: string | null): PaymentWebhookEvent | null {
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[payment:paymongo] PAYMONGO_WEBHOOK_SECRET is not set; rejecting webhook.');
      return null;
    }

    if (!signatureHeader || !verifySignature(rawBody, signatureHeader, secret)) {
      return null;
    }

    const parsed = webhookSchema.safeParse(JSON.parse(rawBody));

    if (!parsed.success) {
      console.error('[payment:paymongo] Unexpected webhook shape:', parsed.error.issues);
      return null;
    }

    const { type, data } = parsed.data.data.attributes;
    const reference = data.attributes.payment_intent_id;

    if (!reference) {
      return null;
    }

    if (type === 'payment.paid') {
      return { reference, status: 'paid' };
    }

    if (type === 'payment.failed') {
      return { reference, status: 'failed' };
    }

    return null;
  },
};

function verifySignature(rawBody: string, header: string, secret: string): boolean {
  const parts = new Map(
    header.split(',').map((piece) => {
      const [key, value] = piece.split('=');
      return [key?.trim() ?? '', value?.trim() ?? ''] as const;
    }),
  );

  const timestamp = parts.get('t');
  const provided = parts.get('te') || parts.get('li');

  if (!timestamp || !provided) {
    return false;
  }

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const expectedBytes = Buffer.from(expected, 'utf8');
  const providedBytes = Buffer.from(provided, 'utf8');

  if (expectedBytes.length !== providedBytes.length) {
    return false;
  }

  return timingSafeEqual(expectedBytes, providedBytes);
}
