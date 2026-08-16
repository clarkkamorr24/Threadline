import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/constants/routes';
import { db } from '@/lib/db';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const probe = NextResponse.next();
  const probeClient = createSupabaseRouteClient(request, probe);

  const {
    data: { user },
  } = await probeClient.auth.getUser();

  const profile = user
    ? await db.user.findUnique({ where: { id: user.id }, select: { role: true } })
    : null;

  const destination = profile?.role === 'ADMIN' ? ROUTES.admin.login : ROUTES.home;

  const response = NextResponse.redirect(new URL(destination, request.nextUrl.origin), {
    status: 303,
  });

  const supabase = createSupabaseRouteClient(request, response);
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('[auth/sign-out] Sign-out failed:', error.message);
  }

  return response;
}
