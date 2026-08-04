'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAX_PRODUCT_IMAGES } from '@/constants/catalog';
import { getStorageCapabilities } from '@/lib/plugins/storage/capabilities';
import { MAX_IMAGE_BYTES, isAllowedImageType } from '@/lib/plugins/storage/types';

export type DraftImage =
  | {
      readonly kind: 'uploaded';
      readonly url: string;
      readonly storageKey: string | null;
      readonly alt?: string;
    }
  | {
      readonly kind: 'pending';
      readonly file: File;
      readonly previewUrl: string;
    };

interface ProductImageFieldProps {
  readonly value: readonly DraftImage[];
  readonly onChange: (images: readonly DraftImage[]) => void;
  readonly disabled?: boolean;
}

export function ProductImageField({ value, onChange, disabled = false }: ProductImageFieldProps) {
  const { supportsUploads } = getStorageCapabilities();
  const [urlDraft, setUrlDraft] = useState('');
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

  const isFull = value.length >= MAX_PRODUCT_IMAGES;

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

    onChange([...value, { kind: 'pending', file, previewUrl }]);
  }

  function handleAddUrl(): void {
    const trimmed = urlDraft.trim();

    if (!trimmed) {
      return;
    }

    onChange([...value, { kind: 'uploaded', url: trimmed, storageKey: null }]);
    setUrlDraft('');
  }

  function handleRemove(index: number): void {
    const image = value[index];

    if (image?.kind === 'pending') {
      URL.revokeObjectURL(image.previewUrl);
    }

    onChange(value.filter((_, position) => position !== index));
  }

  const pendingCount = value.filter((image) => image.kind === 'pending').length;

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((image, index) => (
            <li key={image.kind === 'pending' ? image.previewUrl : `${image.url}-${index}`} className="group relative">
              <div className="bg-muted relative aspect-square overflow-hidden rounded-md border">
                {image.kind === 'pending' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.previewUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <Image
                    src={image.url}
                    alt={image.alt ?? ''}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                )}
              </div>

              {index === 0 ? (
                <span className="bg-primary text-primary-foreground absolute top-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
                  Main
                </span>
              ) : null}

              {image.kind === 'pending' ? (
                <span className="bg-warning text-warning-foreground absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
                  Not uploaded
                </span>
              ) : null}

              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 size-6 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                aria-label={`Remove image ${index + 1}`}
              >
                <Trash2 className="size-3" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-center text-sm">
          No images yet. The first image is used as the product thumbnail.
        </p>
      )}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            {error}
            <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isFull ? (
        <p className="text-muted-foreground text-sm">
          Maximum of {MAX_PRODUCT_IMAGES} images reached.
        </p>
      ) : supportsUploads ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileSelected}
            className="sr-only"
            id="product-image-upload"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Upload aria-hidden="true" />
            Choose image
          </Button>
          <p className="text-muted-foreground mt-2 text-xs">
            JPEG, PNG, WebP or AVIF, up to 5 MB.{' '}
            {pendingCount > 0
              ? `${pendingCount} image${pendingCount === 1 ? '' : 's'} will upload when you save.`
              : 'Images upload to Cloudinary when you save the product.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                type="url"
                value={urlDraft}
                onChange={(event) => setUrlDraft(event.target.value)}
                placeholder="https://example.com/image.jpg"
                className="pl-8"
                disabled={disabled}
                aria-label="Image URL"
              />
            </div>
            <Button type="button" variant="outline" onClick={handleAddUrl} disabled={disabled}>
              <ImagePlus aria-hidden="true" />
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
