import type { Provider, SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import type { AuthOutcome, AuthProviderId, OAuthAuthPlugin } from './types';

interface OAuthPluginConfig {
  readonly id: AuthProviderId;
  readonly label: string;
  readonly provider: Provider;
  readonly scopes?: string;
  readonly isEnabled: () => boolean;
}

export function createOAuthPlugin(config: OAuthPluginConfig): OAuthAuthPlugin {
  return {
    id: config.id,
    kind: 'oauth',
    label: config.label,
    isEnabled: config.isEnabled,

    async signIn(client: SupabaseClient, redirectTo: string): Promise<AuthOutcome> {
      const { data, error } = await client.auth.signInWithOAuth({
        provider: config.provider,
        options: {
          redirectTo,
          scopes: config.scopes,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        throw new AppError(
          'INTERNAL_ERROR',
          `Could not start sign-in with ${config.label}.`,
          error?.status ?? 502,
        );
      }

      return { kind: 'redirect', url: data.url };
    },
  };
}
