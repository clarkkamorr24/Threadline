'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { clientEnv } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import {
  getCredentialsPlugin,
  getEnabledOAuthPlugins,
  type AuthProviderId,
} from '@/lib/plugins/auth';
import { isAppError } from '@/lib/errors';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SignInInput, SignUpInput } from './schema';

interface UseAuthActionsOptions {
  readonly redirectTo: string;
}

interface UseAuthActionsResult {
  readonly signIn: (input: SignInInput) => Promise<void>;
  readonly signUp: (input: SignUpInput) => Promise<void>;
  readonly signInWithProvider: (providerId: AuthProviderId) => Promise<void>;
  readonly oauthProviders: readonly { id: AuthProviderId; label: string }[];
  readonly isSubmitting: boolean;
  readonly pendingProvider: AuthProviderId | null;
  readonly errorMessage: string | null;
  readonly confirmationEmail: string | null;
}

export function useAuthActions({ redirectTo }: UseAuthActionsOptions): UseAuthActionsResult {
  const router = useRouter();
  const toast = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<AuthProviderId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const oauthProviders = useMemo(
    () => getEnabledOAuthPlugins().map((plugin) => ({ id: plugin.id, label: plugin.label })),
    [],
  );

  const toMessage = useCallback(
    (error: unknown, fallback: string): string =>
      isAppError(error) ? error.message : fallback,
    [],
  );

  const signIn = useCallback(
    async (input: SignInInput): Promise<void> => {
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        await getCredentialsPlugin().signIn(supabase, input);
        router.refresh();
        router.push(redirectTo);
      } catch (error) {
        setErrorMessage(toMessage(error, 'Could not sign in. Please try again.'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [redirectTo, router, supabase, toMessage],
  );

  const signUp = useCallback(
    async (input: SignUpInput): Promise<void> => {
      setIsSubmitting(true);
      setErrorMessage(null);
      setConfirmationEmail(null);

      const callbackUrl = `${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.authCallback}?redirectTo=${encodeURIComponent(redirectTo)}`;

      try {
        const outcome = await getCredentialsPlugin().signUp(supabase, input, callbackUrl);
        if (outcome.kind === 'confirmation-required') {
          setConfirmationEmail(outcome.email);
          return;
        }

        toast.success('Welcome to Threadline', 'Your account is ready.');
        router.refresh();
        router.push(redirectTo);
      } catch (error) {
        setErrorMessage(toMessage(error, 'Could not create your account.'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [redirectTo, router, supabase, toast, toMessage],
  );

  const signInWithProvider = useCallback(
    async (providerId: AuthProviderId): Promise<void> => {
      setPendingProvider(providerId);
      setErrorMessage(null);

      const callbackUrl = `${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.authCallback}?redirectTo=${encodeURIComponent(redirectTo)}`;

      try {
        const plugin = getEnabledOAuthPlugins().find((candidate) => candidate.id === providerId);

        if (!plugin) {
          throw new Error(`Provider "${providerId}" is not enabled.`);
        }

        const outcome = await plugin.signIn(supabase, callbackUrl);

        if (outcome.kind === 'redirect') {
          window.location.assign(outcome.url);
          return;
        }

        router.refresh();
        router.push(redirectTo);
      } catch (error) {
        setErrorMessage(toMessage(error, 'Could not start sign-in with that provider.'));
        setPendingProvider(null);
      }
    },
    [redirectTo, router, supabase, toMessage],
  );

  return {
    signIn,
    signUp,
    signInWithProvider,
    oauthProviders,
    isSubmitting,
    pendingProvider,
    errorMessage,
    confirmationEmail,
  };
}
