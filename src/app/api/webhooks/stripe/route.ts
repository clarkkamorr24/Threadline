import { NextResponse } from 'next/server';
import { getPaymentPlugin } from '@/lib/plugins/payment/registry';
import { markOrderPaid } from '@/services/orderService';

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;

  try {
    event = getPaymentPlugin().parseWebhook(rawBody, signature);
  } catch (error) {
    console.error('[webhook:stripe] Provider unavailable:', error);
    return NextResponse.json({ received: false }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  if (event.status === 'paid') {
    let chargedMethod: string | null = null;

    try {
      chargedMethod = (await getPaymentPlugin().getStatus(event.reference)).method;
    } catch (error) {
      console.warn('[webhook:stripe] Could not read the charged method:', error);
    }

    const updated = await markOrderPaid(event.reference, chargedMethod);
    console.info(
      '[webhook:stripe] paid',
      event.reference,
      chargedMethod ?? 'method unknown',
      updated ? '-> PROCESSING' : '(no-op)',
    );
  }

  if (event.status === 'failed') {
    console.warn('[webhook:stripe] payment failed for', event.reference);
  }

  return NextResponse.json({ received: true });
}
