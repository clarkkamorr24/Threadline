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
        // Surfaced to the database trigger / profile sync as user metadata.
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

    // With email confirmation enabled Supabase returns a user but no session.
    return data.session
      ? { kind: 'session', userId: data.user.id }
      : { kind: 'confirmation-required', email: input.email };
  },
};
