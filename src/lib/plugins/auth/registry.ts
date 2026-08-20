import { credentialsAuthPlugin } from './credentials';
import { googleAuthPlugin } from './google';
import type { AuthPlugin, AuthProviderId, CredentialsAuthPlugin, OAuthAuthPlugin } from './types';

const REGISTRY: Readonly<Record<AuthProviderId, AuthPlugin>> = {
  credentials: credentialsAuthPlugin,
  google: googleAuthPlugin,
};

export function getAuthPlugin(id: AuthProviderId): AuthPlugin {
  return REGISTRY[id];
}

export function getCredentialsPlugin(): CredentialsAuthPlugin {
  return credentialsAuthPlugin;
}

export function getEnabledOAuthPlugins(): readonly OAuthAuthPlugin[] {
  return Object.values(REGISTRY).filter(
    (plugin): plugin is OAuthAuthPlugin => plugin.kind === 'oauth' && plugin.isEnabled(),
  );
}

export function isOAuthProviderId(value: string): value is AuthProviderId {
  return value in REGISTRY && REGISTRY[value as AuthProviderId].kind === 'oauth';
}
