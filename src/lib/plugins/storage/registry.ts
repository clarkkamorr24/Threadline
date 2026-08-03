import 'server-only';
import { clientEnv } from '@/config/env';
import { s3StoragePlugin } from './s3';
import type { StoragePlugin, StorageProviderId } from './types';
import { urlStoragePlugin } from './url';

const REGISTRY: Readonly<Record<StorageProviderId, StoragePlugin>> = {
  url: urlStoragePlugin,
  s3: s3StoragePlugin,
};

export function getStoragePlugin(): StoragePlugin {
  return REGISTRY[clientEnv.NEXT_PUBLIC_STORAGE_PROVIDER];
}

export function getStoragePluginById(id: StorageProviderId): StoragePlugin {
  return REGISTRY[id];
}
