'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { getStoragePlugin } from '@/lib/plugins/storage/registry';
import type { UploadTicket } from '@/lib/plugins/storage/types';
import { StorageError } from '@/lib/errors';
import { createAction } from '@/lib/serverAction';

const uploadTicketSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
  folder: z.enum(['products', 'categories']).default('products'),
});

export const createUploadTicketAction = createAction(
  'storage.createUploadTicket',
  uploadTicketSchema,
  async (input): Promise<UploadTicket> => {
    await requireAdmin();

    const storage = getStoragePlugin();

    if (!storage.supportsUploads) {
      throw new StorageError(
        `The "${storage.label}" storage provider does not accept file uploads.`,
      );
    }

    return storage.createUploadTicket(input);
  },
);

const removeAssetSchema = z.object({
  storageKey: z.string().min(1),
});

export const removeUploadedAssetAction = createAction(
  'storage.removeAsset',
  removeAssetSchema,
  async (input): Promise<{ removed: true }> => {
    await requireAdmin();

    await getStoragePlugin().remove(input.storageKey);
    return { removed: true };
  },
);
