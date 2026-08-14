import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/constants/routes';
import { SUSPENDED_MESSAGE } from '@/entities/user/model/types';
import { db } from '@/lib/db';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { origin } = request.nextUrl;

  const signInUrl = new URL(ROUTES.signIn, origin);
  signInUrl.searchParams.set('error', SUSPENDED_MESSAGE);

  const response = NextResponse.redirect(signInUrl);
  const supabase = createSupabaseRouteClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(ROUTES.signIn, origin));
  }

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { isActive: true },
  });

  if (!profile || profile.isActive) {
    return NextResponse.redirect(new URL(ROUTES.home, origin));
  }

  await supabase.auth.signOut();

  return response;
}
