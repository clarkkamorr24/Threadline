import { clientEnv } from '@/config/env';
import { createOAuthPlugin } from './createOAuthPlugin';

export const githubAuthPlugin = createOAuthPlugin({
  id: 'github',
  label: 'GitHub',
  provider: 'github',
  scopes: 'read:user user:email',
  isEnabled: () => clientEnv.NEXT_PUBLIC_AUTH_GITHUB_ENABLED,
});
