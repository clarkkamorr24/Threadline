import { clientEnv } from '@/config/env';
import type { StorageProviderId } from './types';

interface StorageCapabilities {
  readonly provider: StorageProviderId;
  readonly supportsUploads: boolean;
}

const CAPABILITIES: Readonly<Record<StorageProviderId, boolean>> = {
  url: false,
  s3: true,
};

export function getStorageCapabilities(): StorageCapabilities {
  const provider = clientEnv.NEXT_PUBLIC_STORAGE_PROVIDER;
  return { provider, supportsUploads: CAPABILITIES[provider] };
}
