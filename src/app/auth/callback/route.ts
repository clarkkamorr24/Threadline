import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/constants/routes';
import { getCurrentUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');

  if (providerError) {
    const url = new URL(ROUTES.signIn, origin);
    url.searchParams.set('error', providerError);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL(ROUTES.signIn, origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] Code exchange failed:', error.message);
    const url = new URL(ROUTES.signIn, origin);
    url.searchParams.set('error', 'Sign-in could not be completed. Please try again.');
    return NextResponse.redirect(url);
  }

  await getCurrentUser();

  const requested = searchParams.get('redirectTo');
  const isSafeRelativePath =
    requested !== null && requested.startsWith('/') && !requested.startsWith('//');

  return NextResponse.redirect(new URL(isSafeRelativePath ? requested : ROUTES.home, origin));
}
