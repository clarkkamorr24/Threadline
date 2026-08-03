import 'server-only';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerEnv } from '@/config/env';
import { StorageError, ValidationError } from '@/lib/errors';
import {
  MAX_IMAGE_BYTES,
  isAllowedImageType,
  type CreateUploadTicketInput,
  type StoragePlugin,
  type UploadTicket,
} from './types';

const PRESIGNED_URL_TTL_SECONDS = 300;

interface S3Config {
  readonly region: string;
  readonly bucket: string;
  readonly publicBaseUrl: string;
  readonly endpoint: string | undefined;
  readonly forcePathStyle: boolean;
  readonly credentials: { readonly accessKeyId: string; readonly secretAccessKey: string };
}

let cachedClient: S3Client | null = null;
let cachedConfig: S3Config | null = null;

function getConfig(): S3Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const env = getServerEnv();
  const missing = (
    [
      ['AWS_REGION', env.AWS_REGION],
      ['AWS_S3_BUCKET', env.AWS_S3_BUCKET],
      ['AWS_ACCESS_KEY_ID', env.AWS_ACCESS_KEY_ID],
      ['AWS_SECRET_ACCESS_KEY', env.AWS_SECRET_ACCESS_KEY],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new StorageError(
      `S3 storage is selected but these variables are unset: ${missing.join(', ')}.`,
    );
  }

  const region = env.AWS_REGION as string;
  const bucket = env.AWS_S3_BUCKET as string;
  const endpoint = env.AWS_S3_ENDPOINT;

  cachedConfig = {
    region,
    bucket,
    endpoint,
    forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string,
    },
    publicBaseUrl: (
      env.AWS_S3_PUBLIC_URL ??
      (endpoint ? `${endpoint}/${bucket}` : `https://${bucket}.s3.${region}.amazonaws.com`)
    ).replace(/\/$/, ''),
  };

  return cachedConfig;
}

function getClient(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getConfig();
  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: config.credentials,
  });

  return cachedClient;
}

function buildObjectKey(folder: string, fileName: string): string {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, '').toLowerCase();
  const extension = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'bin';
  const stem = fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${safeFolder || 'uploads'}/${randomUUID()}${stem ? `-${stem}` : ''}.${extension}`;
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

export const s3StoragePlugin: StoragePlugin = {
  id: 's3',
  label: 'AWS S3',
  supportsUploads: true,

  async createUploadTicket(input: CreateUploadTicketInput): Promise<UploadTicket> {
    assertUploadable(input);

    const config = getConfig();
    const key = buildObjectKey(input.folder, input.fileName);

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.sizeBytes,
    });

    try {
      const uploadUrl = await getSignedUrl(getClient(), command, {
        expiresIn: PRESIGNED_URL_TTL_SECONDS,
      });

      return {
        key,
        uploadUrl,
        headers: {
          'Content-Type': input.contentType,
        },
        publicUrl: `${config.publicBaseUrl}/${key}`,
        expiresInSeconds: PRESIGNED_URL_TTL_SECONDS,
      };
    } catch (error) {
      console.error('[storage:s3] Failed to presign upload:', error);
      throw new StorageError('Could not prepare the upload. Please try again.');
    }
  },

  async remove(key: string): Promise<void> {
    const config = getConfig();

    try {
      await getClient().send(
        new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
      );
    } catch (error) {
      console.error('[storage:s3] Failed to delete object:', error);
      throw new StorageError('Could not delete the stored file.');
    }
  },

  resolveUrl(key: string): string {
    return `${getConfig().publicBaseUrl}/${key}`;
  },
};
