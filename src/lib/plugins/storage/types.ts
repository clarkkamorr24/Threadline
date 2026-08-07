export const STORAGE_PROVIDER_IDS = ['url', 'cloudinary'] as const;

export type StorageProviderId = (typeof STORAGE_PROVIDER_IDS)[number];

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface CreateUploadTicketInput {
  readonly folder: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly contentHash: string;
}

export interface UploadTicket {
  readonly key: string;
  readonly uploadUrl: string;
  readonly method: 'POST' | 'PUT';
  readonly fields: Readonly<Record<string, string>>;
  readonly headers: Readonly<Record<string, string>>;
  readonly publicUrl: string;
  readonly expiresInSeconds: number;
}

export interface StoragePlugin {
  readonly id: StorageProviderId;
  readonly label: string;
  readonly supportsUploads: boolean;

  createUploadTicket(input: CreateUploadTicketInput): Promise<UploadTicket>;
  remove(key: string): Promise<void>;
  resolveUrl(key: string): string;
}

export function isAllowedImageType(value: string): value is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);
}
