import 'server-only';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { SetAllCookies } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clientEnv, getServerEnv } from '@/config/env';

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            //
          }
        },
      },
    },
  );
}

export function createSupabaseRouteClient(
  request: NextRequest,
  response: NextResponse,
): SupabaseClient {
  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );
}

export function createSupabaseAdminClient(): SupabaseClient {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  return createServerClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll: () => [],
      setAll: () => undefined,
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
