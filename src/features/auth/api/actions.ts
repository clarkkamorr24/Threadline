'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { enforceRateLimit } from '@/lib/rateLimit';
import { createAction } from '@/lib/serverAction';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const OAUTH_LABELS: Readonly<Record<string, string>> = {
  google: 'Google',
};

const lookupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const getAccountStatusAction = createAction(
  'auth.accountStatus',
  z.object({}),
  async (): Promise<{ isSuspended: boolean }> => {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isSuspended: false };
    }

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: { isActive: true },
    });

    return { isSuspended: profile !== null && !profile.isActive };
  },
);

export interface SignInMethodHint {
  readonly oauthOnly: boolean;
  readonly providerLabel: string | null;
}

export const describeSignInMethodAction = createAction(
  'auth.describeSignInMethod',
  lookupSchema,
  async (input): Promise<SignInMethodHint> => {
    await enforceRateLimit({ bucket: 'auth.signInMethod', limit: 10, windowMs: 60_000 });

    const profile = await db.user.findUnique({
      where: { email: input.email },
      select: { signInProviders: true },
    });

    const providers = profile?.signInProviders ?? [];
    const oauthProviders = providers.filter((provider) => provider !== 'email');
    const oauthOnly =
      providers.length > 0 && oauthProviders.length > 0 && !providers.includes('email');

    if (!oauthOnly) {
      return { oauthOnly: false, providerLabel: null };
    }

    const first = oauthProviders[0] ?? '';

    return {
      oauthOnly: true,
      providerLabel: OAUTH_LABELS[first] ?? first.charAt(0).toUpperCase() + first.slice(1),
    };
  },
);

export const checkEmailRegisteredAction = createAction(
  'auth.checkEmailRegistered',
  lookupSchema,
  async (input): Promise<{ registered: boolean }> => {
    await enforceRateLimit({ bucket: 'auth.emailExists', limit: 8, windowMs: 60_000 });

    const profile = await db.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    return { registered: profile !== null };
  },
);
