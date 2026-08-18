'use server';

import { z } from 'zod';
import { requireAdmin, requireUser } from '@/lib/auth/session';
import { StorageError } from '@/lib/errors';
import { getStoragePlugin } from '@/lib/plugins/storage/registry';
import type { UploadTicket } from '@/lib/plugins/storage/types';
import { enforceRateLimit } from '@/lib/rateLimit';
import { createAction } from '@/lib/serverAction';

const UPLOAD_FOLDERS = ['products', 'categories', 'avatars'] as const;

type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

const uploadTicketSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i, 'Invalid content hash.'),
  folder: z.enum(UPLOAD_FOLDERS).default('products'),
});

async function authorizeFolder(folder: UploadFolder): Promise<void> {
  if (folder === 'avatars') {
    await requireUser();
    return;
  }

  await requireAdmin();
}

export const createUploadTicketAction = createAction(
  'storage.createUploadTicket',
  uploadTicketSchema,
  async (input): Promise<UploadTicket> => {
    await authorizeFolder(input.folder);
    await enforceRateLimit({ bucket: 'storage.uploadTicket', limit: 60, windowMs: 60_000 });

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
