import 'server-only';
import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { getServerEnv } from '@/config/env';
import { StorageError, ValidationError } from '@/lib/errors';
import {
  MAX_IMAGE_BYTES,
  isAllowedImageType,
  type CreateUploadTicketInput,
  type StoragePlugin,
  type UploadTicket,
} from './types';

const SIGNATURE_TTL_SECONDS = 600;
const CLOUDINARY_API_BASE = 'https://api.cloudinary.com/v1_1';

interface CloudinaryConfig {
  readonly cloudName: string;
  readonly apiKey: string;
  readonly apiSecret: string;
}

let cachedConfig: CloudinaryConfig | null = null;

function getConfig(): CloudinaryConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const env = getServerEnv();
  const missing = (
    [
      ['CLOUDINARY_CLOUD_NAME', env.CLOUDINARY_CLOUD_NAME],
      ['CLOUDINARY_API_KEY', env.CLOUDINARY_API_KEY],
      ['CLOUDINARY_API_SECRET', env.CLOUDINARY_API_SECRET],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new StorageError(
      `Cloudinary storage is selected but these variables are unset: ${missing.join(', ')}.`,
    );
  }

  cachedConfig = {
    cloudName: env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: env.CLOUDINARY_API_KEY as string,
    apiSecret: env.CLOUDINARY_API_SECRET as string,
  };

  cloudinary.config({
    cloud_name: cachedConfig.cloudName,
    api_key: cachedConfig.apiKey,
    api_secret: cachedConfig.apiSecret,
    secure: true,
  });

  return cachedConfig;
}

function buildPublicId(folder: string, fileName: string): string {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'uploads';
  const stem = fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${safeFolder}/${randomUUID()}${stem ? `-${stem}` : ''}`;
}

function assertUploadable(input: CreateUploadTicketInput): void {
  if (!isAllowedImageType(input.contentType)) {
    throw new ValidationError('Only JPEG, PNG, WebP and AVIF images are accepted.');
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_IMAGE_BYTES) {
    throw new ValidationError(
      `Images must be larger than 0 bytes and at most ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`,
    );
  }
}

export const cloudinaryStoragePlugin: StoragePlugin = {
  id: 'cloudinary',
  label: 'Cloudinary',
  supportsUploads: true,

  createUploadTicket(input: CreateUploadTicketInput): Promise<UploadTicket> {
    assertUploadable(input);

    const config = getConfig();
    const publicId = buildPublicId(input.folder, input.fileName);
    const timestamp = Math.floor(Date.now() / 1000);

    const signedParams = {
      public_id: publicId,
      timestamp,
    };

    try {
      const signature = cloudinary.utils.api_sign_request(signedParams, config.apiSecret);

      return Promise.resolve({
        key: publicId,
        uploadUrl: `${CLOUDINARY_API_BASE}/${config.cloudName}/image/upload`,
        method: 'POST',
        fields: {
          api_key: config.apiKey,
          timestamp: String(timestamp),
          signature,
          public_id: publicId,
        },
        headers: {},
        publicUrl: cloudinary.url(publicId, { secure: true }),
        expiresInSeconds: SIGNATURE_TTL_SECONDS,
      });
    } catch (error) {
      console.error('[storage:cloudinary] Failed to sign upload:', error);
      return Promise.reject(new StorageError('Could not prepare the upload. Please try again.'));
    }
  },

  async remove(key: string): Promise<void> {
    getConfig();

    try {
      const result = await cloudinary.uploader.destroy(key, { invalidate: true });
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new StorageError(`Cloudinary refused the delete: ${result.result}`);
      }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      console.error('[storage:cloudinary] Failed to delete asset:', error);
      throw new StorageError('Could not delete the stored file.');
    }
  },

  resolveUrl(key: string): string {
    getConfig();
    return cloudinary.url(key, { secure: true });
  },
};
