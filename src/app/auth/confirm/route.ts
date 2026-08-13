import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { ROUTES } from '@/constants/routes';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

const OTP_TYPES: readonly EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
];

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (OTP_TYPES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const requestedNext = searchParams.get('next');

  const next =
    requestedNext !== null && requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : ROUTES.home;

  const failWith = (message: string): NextResponse => {
    const url = new URL(ROUTES.signIn, origin);
    url.searchParams.set('error', message);
    return NextResponse.redirect(url);
  };

  const code = searchParams.get('code');

  if (!tokenHash && code) {
    const response = NextResponse.redirect(new URL(next, origin));
    const supabase = createSupabaseRouteClient(request, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    console.error('[auth/confirm] Code exchange failed:', error.message);

    return failWith(
      'That link could not be completed in this browser. Open it in the browser you requested it from, or request a new one.',
    );
  }

  if (!tokenHash || !isOtpType(type)) {
    console.warn(
      '[auth/confirm] Rejected: no usable token_hash/type.',
      '\n  incoming url :',
      request.nextUrl.toString(),
      '\n  query keys   :',
      [...searchParams.keys()].join(', ') || '(none)',
      '\n  hint         : a "code" param means the email template still uses {{ .ConfirmationURL }};',
      '\n                 it must be {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password',
    );

    return failWith(
      'That link could not be verified. It may have expired or already been used, request a new one.',
    );
  }

  const response = NextResponse.redirect(new URL(next, origin));
  const supabase = createSupabaseRouteClient(request, response);

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    console.error('[auth/confirm] verifyOtp failed:', error.message);

    return failWith(
      type === 'recovery'
        ? 'That reset link has expired or was already used. Request a new one.'
        : 'That link has expired or was already used. Please request a new one.',
    );
  }

  return response;
}
