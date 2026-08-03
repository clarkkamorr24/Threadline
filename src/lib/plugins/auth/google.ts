import { clientEnv } from '@/config/env';
import { createOAuthPlugin } from './createOAuthPlugin';

export const googleAuthPlugin = createOAuthPlugin({
  id: 'google',
  label: 'Google',
  provider: 'google',
  scopes: 'openid email profile',
  isEnabled: () => clientEnv.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED,
});
