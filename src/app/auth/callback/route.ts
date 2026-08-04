import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/constants/routes';
import { getCurrentUser } from '@/lib/auth/session';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

/**
 * OAuth and email-confirmation callback.
 *
 * Supabase redirects here with a one-time `code`, which is exchanged for a
 * session. As in sign-out, the redirect response is built first and given to
 * the Supabase client: the exchange writes the new session cookies, and those
 * writes must land on the response actually returned or the user arrives back
 * still signed out.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');

  const failWith = (message: string): NextResponse => {
    const url = new URL(ROUTES.signIn, origin);
    url.searchParams.set('error', message);
    return NextResponse.redirect(url);
  };

  // The user declined consent, or the provider rejected the request.
  if (providerError) {
    return failWith(providerError);
  }

  if (!code) {
    return NextResponse.redirect(new URL(ROUTES.signIn, origin));
  }

  // `redirectTo` is attacker-controllable, so only same-origin relative paths
  // are honoured — otherwise this is an open redirect.
  const requested = searchParams.get('redirectTo');
  const isSafeRelativePath =
    requested !== null && requested.startsWith('/') && !requested.startsWith('//');

  const response = NextResponse.redirect(
    new URL(isSafeRelativePath ? requested : ROUTES.home, origin),
  );

  const supabase = createSupabaseRouteClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] Code exchange failed:', error.message);
    return failWith('Sign-in could not be completed. Please try again.');
  }

  // Creates the profile row on first sign-in, so later pages never race it.
  await getCurrentUser();

  return response;
}
