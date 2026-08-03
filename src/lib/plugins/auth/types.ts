import type { SupabaseClient } from '@supabase/supabase-js';

export const AUTH_PROVIDER_IDS = ['credentials', 'github', 'google', 'azure'] as const;

export type AuthProviderId = (typeof AUTH_PROVIDER_IDS)[number];

export interface AuthCredentials {
  readonly email: string;
  readonly password: string;
}

export interface AuthSignUpInput extends AuthCredentials {
  readonly name: string;
}
export type AuthOutcome =
  | { readonly kind: 'session'; readonly userId: string }
  | { readonly kind: 'redirect'; readonly url: string }
  | { readonly kind: 'confirmation-required'; readonly email: string };

interface AuthPluginBase {
  readonly id: AuthProviderId;
  readonly label: string;
  isEnabled(): boolean;
}

export interface CredentialsAuthPlugin extends AuthPluginBase {
  readonly kind: 'credentials';
  signIn(client: SupabaseClient, credentials: AuthCredentials): Promise<AuthOutcome>;
  signUp(client: SupabaseClient, input: AuthSignUpInput, redirectTo: string): Promise<AuthOutcome>;
}

export interface OAuthAuthPlugin extends AuthPluginBase {
  readonly kind: 'oauth';
  signIn(client: SupabaseClient, redirectTo: string): Promise<AuthOutcome>;
}

export type AuthPlugin = CredentialsAuthPlugin | OAuthAuthPlugin;
