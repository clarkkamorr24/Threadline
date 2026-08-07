'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImageOff, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getStorageCapabilities } from '@/lib/plugins/storage/capabilities';
import { MAX_IMAGE_BYTES, isAllowedImageType } from '@/lib/plugins/storage/types';

export type CategoryImageDraft =
  | { readonly kind: 'uploaded'; readonly url: string }
  | { readonly kind: 'pending'; readonly file: File; readonly previewUrl: string }
  | null;

interface CategoryImageFieldProps {
  readonly value: CategoryImageDraft;
  readonly onChange: (image: CategoryImageDraft) => void;
  readonly disabled?: boolean;
}

export function CategoryImageField({
  value,
  onChange,
  disabled = false,
}: CategoryImageFieldProps) {
  const { supportsUploads } = getStorageCapabilities();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createdUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const createdUrls = createdUrlsRef.current;

    return () => {
      for (const url of createdUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!isAllowedImageType(file.type)) {
      setError('Only JPEG, PNG, WebP and AVIF images are accepted.');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Images must be at most ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`);
      return;
    }

    setError(null);

    const previewUrl = URL.createObjectURL(file);
    createdUrlsRef.current.push(previewUrl);

    onChange({ kind: 'pending', file, previewUrl });
  }

  function handleRemove(): void {
    if (value?.kind === 'pending') {
      URL.revokeObjectURL(value.previewUrl);
    }

    onChange(null);
  }

  const previewSrc =
    value?.kind === 'pending' ? value.previewUrl : value?.kind === 'uploaded' ? value.url : null;

  if (!supportsUploads) {
    return (
      <div className="flex flex-col gap-2">
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={value?.kind === 'uploaded' ? value.url : ''}
          onChange={(event) =>
            onChange(event.target.value ? { kind: 'uploaded', url: event.target.value } : null)
          }
          disabled={disabled}
          aria-label="Category image URL"
        />
        <p className="text-muted-foreground text-xs">
          Set NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary to upload files instead.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-md border">
          {previewSrc ? (
            value?.kind === 'pending' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <Image src={previewSrc} alt="" fill sizes="96px" className="object-cover" />
            )
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <ImageOff className="size-5" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={handleFileSelected}
            disabled={disabled}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <Upload aria-hidden="true" />
              {previewSrc ? 'Replace image' : 'Choose image'}
            </Button>
            {previewSrc ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <Trash2 aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
          {value?.kind === 'pending' ? (
            <p className="text-muted-foreground text-xs">Uploads when you save.</p>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
