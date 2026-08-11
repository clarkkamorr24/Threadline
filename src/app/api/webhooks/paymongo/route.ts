import { NextResponse } from 'next/server';
import { getPaymentPlugin } from '@/lib/plugins/payment/registry';
import { markOrderPaid } from '@/services/orderService';

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get('paymongo-signature');

  let event;

  try {
    event = getPaymentPlugin().parseWebhook(rawBody, signature);
  } catch (error) {
    console.error('[webhook:paymongo] Provider unavailable:', error);
    return NextResponse.json({ received: false }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  if (event.status === 'paid') {
    const updated = await markOrderPaid(event.reference);
    console.info('[webhook:paymongo] paid', event.reference, updated ? '-> PROCESSING' : '(no-op)');
  }

  if (event.status === 'failed') {
    console.warn('[webhook:paymongo] payment failed for', event.reference);
  }

  return NextResponse.json({ received: true });
}
