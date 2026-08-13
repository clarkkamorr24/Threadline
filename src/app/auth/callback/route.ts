import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/constants/routes';
import { getCurrentUser } from '@/lib/auth/session';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');

  const failWith = (message: string): NextResponse => {
    const url = new URL(ROUTES.signIn, origin);
    url.searchParams.set('error', message);
    return NextResponse.redirect(url);
  };
  if (providerError) {
    console.error('[auth/callback] Provider returned an error:', providerError);

    if (/exchange external code/i.test(providerError)) {
      return failWith(
        'Sign-in with that provider could not be completed. Its credentials look misconfigured — try email and password for now.',
      );
    }

    return failWith(providerError);
  }

  if (!code) {
    return NextResponse.redirect(new URL(ROUTES.signIn, origin));
  }

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

  await getCurrentUser();

  return response;
}
