import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/constants/routes';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

/**
 * Sign-out endpoint.
 *
 * POST only. A GET route would let a prefetch, a crawler, or an <img> tag on
 * another site sign the user out without their intent.
 *
 * The redirect response is built *first* and handed to the Supabase client, so
 * the cookie-clearing writes land on the response that is actually returned.
 * Constructing the response afterwards discards them — the endpoint then
 * answers 303 with no `Set-Cookie` and the session survives.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 303 forces the browser to follow with GET; a 307 would replay the POST.
  const response = NextResponse.redirect(new URL(ROUTES.home, request.nextUrl.origin), {
    status: 303,
  });

  const supabase = createSupabaseRouteClient(request, response);
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('[auth/sign-out] Sign-out failed:', error.message);
  }

  return response;
}
