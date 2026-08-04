import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getServerEnv } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import type { AuthenticatedUser } from '@/entities/user/model/types';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { db } from '@/lib/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function resolveDisplayName(supabaseUser: SupabaseUser): string | null {
  const metadata = supabaseUser.user_metadata;
  const candidate = metadata.name ?? metadata.full_name ?? metadata.user_name;
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
}

function resolveAvatarUrl(supabaseUser: SupabaseUser): string | null {
  const candidate = supabaseUser.user_metadata.avatar_url ?? supabaseUser.user_metadata.picture;
  return typeof candidate === 'string' && candidate.trim() ? candidate : null;
}

async function provisionProfile(supabaseUser: SupabaseUser): Promise<AuthenticatedUser> {
  const email = supabaseUser.email?.toLowerCase();

  if (!email) {
    throw new UnauthorizedError('Your account has no email address associated with it.');
  }

  const { ADMIN_EMAILS } = getServerEnv();
  const role = ADMIN_EMAILS.includes(email) ? 'ADMIN' : 'USER';

  const profile = await db.user.upsert({
    where: { id: supabaseUser.id },
    update: {
      email,
      ...(role === 'ADMIN' ? { role } : {}),
    },
    create: {
      id: supabaseUser.id,
      email,
      name: resolveDisplayName(supabaseUser),
      avatarUrl: resolveAvatarUrl(supabaseUser),
      role,
    },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true },
  });

  return profile;
}

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true },
  });

  if (!profile) {
    return provisionProfile(user);
  }

  return applyAdminAllowList(profile);
});

async function applyAdminAllowList(
  profile: AuthenticatedUser,
): Promise<AuthenticatedUser> {
  const { ADMIN_EMAILS } = getServerEnv();

  if (profile.role === 'ADMIN' || !ADMIN_EMAILS.includes(profile.email.toLowerCase())) {
    return profile;
  }

  const promoted = await db.user.update({
    where: { id: profile.id },
    data: { role: 'ADMIN' },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true },
  });

  console.info(`[auth] Promoted ${promoted.email} to ADMIN via ADMIN_EMAILS.`);

  return promoted;
}


export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export async function requireShopper(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (user.role !== 'USER') {
    throw new ForbiddenError(
      'Shopping is a storefront feature. Sign in with a customer account to continue.',
    );
  }

  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (user.role !== 'ADMIN') {
    throw new ForbiddenError('This area is restricted to administrators.');
  }

  return user;
}

export async function requireUserOrRedirect(returnTo: string): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`${ROUTES.signIn}?redirectTo=${encodeURIComponent(returnTo)}`);
  }

  return user;
}
