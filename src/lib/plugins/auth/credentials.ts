import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError, ConflictError, UnauthorizedError } from '@/lib/errors';
import type {
  AuthCredentials,
  AuthOutcome,
  AuthSignUpInput,
  CredentialsAuthPlugin,
} from './types';

export const credentialsAuthPlugin: CredentialsAuthPlugin = {
  id: 'credentials',
  kind: 'credentials',
  label: 'Email and password',

  isEnabled: () => true,

  async signIn(client: SupabaseClient, credentials: AuthCredentials): Promise<AuthOutcome> {
    const { data, error } = await client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.user) {
      throw new UnauthorizedError('Incorrect email or password.');
    }

    return { kind: 'session', userId: data.user.id };
  },

  async signUp(
    client: SupabaseClient,
    input: AuthSignUpInput,
    redirectTo: string,
  ): Promise<AuthOutcome> {
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: redirectTo,
        data: { name: input.name },
      },
    });

    if (error) {
      if (error.status === 422 || error.code === 'user_already_exists') {
        throw new ConflictError('An account with that email already exists.');
      }
      throw new AppError('INTERNAL_ERROR', error.message, error.status ?? 500);
    }

    if (!data.user) {
      throw new AppError('INTERNAL_ERROR', 'Account creation failed.', 500);
    }

    if (data.user.identities?.length === 0) {
      throw new ConflictError('An account with that email already exists.');
    }

    return data.session
      ? { kind: 'session', userId: data.user.id }
      : { kind: 'confirmation-required', email: input.email };
  },

  async requestPasswordReset(
    client: SupabaseClient,
    email: string,
    redirectTo: string,
  ): Promise<void> {
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });

    if (!error) {
      return;
    }

    const detail = {
      name: error.name,
      status: error.status,
      code: (error as { code?: string }).code,
      message: error.message,
    };

    console.error('[auth:credentials] Password reset request failed:', detail, error);

    if (error.status === 429 || /rate limit/i.test(error.message)) {
      throw new AppError(
        'INTERNAL_ERROR',
        'Too many reset emails have been sent. Wait a few minutes and try again.',
        429,
      );
    }

    if (!error.status || error.name === 'AuthRetryableFetchError') {
      throw new AppError(
        'INTERNAL_ERROR',
        'Could not reach the authentication service. Check your connection and try again.',
        503,
      );
    }

    throw new AppError(
      'INTERNAL_ERROR',
      error.message
        ? `The reset email could not be sent: ${error.message}`
        : 'The reset email could not be sent. Please try again shortly.',
      error.status,
    );
  },

  async updatePassword(client: SupabaseClient, password: string): Promise<void> {
    const { error } = await client.auth.updateUser({ password });

    if (error) {
      throw new AppError('INTERNAL_ERROR', error.message, error.status ?? 500);
    }
  },
};
