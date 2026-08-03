import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/constants/routes';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('[auth/sign-out] Sign-out failed:', error.message);
  }

  return NextResponse.redirect(new URL(ROUTES.home, request.nextUrl.origin), { status: 303 });
}
