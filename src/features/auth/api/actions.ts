'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { createAction } from '@/lib/serverAction';

const OAUTH_LABELS: Readonly<Record<string, string>> = {
  google: 'Google',
  github: 'GitHub',
  azure: 'Microsoft',
};

const lookupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export interface SignInMethodHint {
  readonly oauthOnly: boolean;
  readonly providerLabel: string | null;
}

export const describeSignInMethodAction = createAction(
  'auth.describeSignInMethod',
  lookupSchema,
  async (input): Promise<SignInMethodHint> => {
    const profile = await db.user.findUnique({
      where: { email: input.email },
      select: { signInProviders: true },
    });

    const providers = profile?.signInProviders ?? [];
    const oauthProviders = providers.filter((provider) => provider !== 'email');
    const oauthOnly = providers.length > 0 && oauthProviders.length > 0 && !providers.includes('email');

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
