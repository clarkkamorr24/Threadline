'use client';

import { useCallback, useState } from 'react';
import { MAX_IMAGE_BYTES, isAllowedImageType } from '@/lib/plugins/storage/types';
import type { UploadTicket } from '@/lib/plugins/storage/types';
import { createUploadTicketAction } from '@/features/admin-products/api/uploadActions';

export interface UploadedImage {
  readonly storageKey: string;
  readonly url: string;
}

interface UseImageUploadResult {
  readonly upload: (file: File) => Promise<UploadedImage | null>;
  readonly isUploading: boolean;
  readonly error: string | null;
  readonly reset: () => void;
}

export function useImageUpload(folder: 'products' | 'categories' = 'products'): UseImageUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => setError(null), []);

  const upload = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      if (!isAllowedImageType(file.type)) {
        setError('Only JPEG, PNG, WebP and AVIF images are accepted.');
        return null;
      }

      if (file.size > MAX_IMAGE_BYTES) {
        setError(`Images must be at most ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`);
        return null;
      }

      setIsUploading(true);
      setError(null);

      try {
        const ticketResult = await createUploadTicketAction({
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          folder,
        });

        if (!ticketResult.success) {
          setError(ticketResult.error.message);
          return null;
        }

        const ticket: UploadTicket = ticketResult.data;
        const response = await sendFile(ticket, file);

        if (!response.ok) {
          console.error('[useImageUpload] Provider rejected the upload:', response.status);
          setError('The image could not be uploaded. Please try again.');
          return null;
        }

        return { storageKey: ticket.key, url: ticket.publicUrl };
      } catch (cause) {
        console.error('[useImageUpload] Upload failed:', cause);
        setError('The image could not be uploaded. Please try again.');
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [folder],
  );

  return { upload, isUploading, error, reset };
}

function sendFile(ticket: UploadTicket, file: File): Promise<Response> {
  if (ticket.method === 'POST') {
    const form = new FormData();

    for (const [name, value] of Object.entries(ticket.fields)) {
      form.append(name, value);
    }
    form.append('file', file);

    return fetch(ticket.uploadUrl, { method: 'POST', body: form });
  }

  return fetch(ticket.uploadUrl, {
    method: 'PUT',
    headers: ticket.headers,
    body: file,
  });
}
