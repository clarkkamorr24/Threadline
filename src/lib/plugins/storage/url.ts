import { StorageError } from '@/lib/errors';
import type { StoragePlugin, UploadTicket } from './types';

export const urlStoragePlugin: StoragePlugin = {
  id: 'url',
  label: 'External URL',
  supportsUploads: false,

  createUploadTicket(): Promise<UploadTicket> {
    return Promise.reject(
      new StorageError('The URL storage provider does not accept file uploads.'),
    );
  },

  remove(): Promise<void> {
    return Promise.resolve();
  },

  resolveUrl(key: string): string {
    return key;
  },
};
