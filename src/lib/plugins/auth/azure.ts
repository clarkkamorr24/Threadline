import { clientEnv } from '@/config/env';
import { createOAuthPlugin } from './createOAuthPlugin';

export const azureAuthPlugin = createOAuthPlugin({
  id: 'azure',
  label: 'Microsoft',
  provider: 'azure',
  scopes: 'openid email profile',
  isEnabled: () => clientEnv.NEXT_PUBLIC_AUTH_AZURE_ENABLED,
});
