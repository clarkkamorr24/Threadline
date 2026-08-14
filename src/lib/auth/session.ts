import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getServerEnv } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { SUSPENDED_MESSAGE } from '@/entities/user/model/types';
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

function resolveSignInProviders(supabaseUser: SupabaseUser): string[] {
  const fromIdentities = (supabaseUser.identities ?? [])
    .map((identity) => identity.provider)
    .filter((provider): provider is string => Boolean(provider));

  const metadata = supabaseUser.app_metadata as {
    provider?: unknown;
    providers?: unknown;
  };

  const fromMetadata = Array.isArray(metadata.providers)
    ? metadata.providers.filter((provider): provider is string => typeof provider === 'string')
    : typeof metadata.provider === 'string'
      ? [metadata.provider]
      : [];

  return [...new Set([...fromIdentities, ...fromMetadata])];
}

async function provisionProfile(supabaseUser: SupabaseUser): Promise<AuthenticatedUser> {
  const email = supabaseUser.email?.toLowerCase();

  if (!email) {
    throw new UnauthorizedError('Your account has no email address associated with it.');
  }

  const { ADMIN_EMAILS } = getServerEnv();
  const role = ADMIN_EMAILS.includes(email) ? 'ADMIN' : 'USER';

  const signInProviders = resolveSignInProviders(supabaseUser);

  const profile = await db.user.upsert({
    where: { id: supabaseUser.id },
    update: {
      email,
      ...(signInProviders.length > 0 ? { signInProviders } : {}),
      ...(role === 'ADMIN' ? { role } : {}),
    },
    create: {
      id: supabaseUser.id,
      email,
      name: resolveDisplayName(supabaseUser),
      avatarUrl: resolveAvatarUrl(supabaseUser),
      signInProviders,
      role,
    },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true, isActive: true },
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
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      signInProviders: true,
    },
  });

  if (!profile) {
    return provisionProfile(user);
  }

  const { signInProviders, ...authenticated } = profile;
  const current = resolveSignInProviders(user);
  const missing = current.filter((provider) => !signInProviders.includes(provider));

  if (missing.length > 0) {
    await db.user.update({
      where: { id: user.id },
      data: { signInProviders: [...signInProviders, ...missing] },
    });
  }

  return applyAdminAllowList(authenticated);
});

async function applyAdminAllowList(profile: AuthenticatedUser): Promise<AuthenticatedUser> {
  const { ADMIN_EMAILS } = getServerEnv();

  if (profile.role === 'ADMIN' || !ADMIN_EMAILS.includes(profile.email.toLowerCase())) {
    return profile;
  }

  const promoted = await db.user.update({
    where: { id: profile.id },
    data: { role: 'ADMIN' },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true, isActive: true },
  });

  console.info(`[auth] Promoted ${promoted.email} to ADMIN via ADMIN_EMAILS.`);

  return promoted;
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  if (!user.isActive) {
    throw new ForbiddenError(SUSPENDED_MESSAGE);
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

  if (!user.isActive) {
    throw new ForbiddenError(SUSPENDED_MESSAGE);
  }

  return user;
}
