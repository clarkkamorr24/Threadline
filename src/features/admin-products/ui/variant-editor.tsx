'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Copy, Plus, Trash2, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MAX_VARIANTS, MAX_VARIANT_IMAGES } from '@/constants/catalog';
import { getStorageCapabilities } from '@/lib/plugins/storage/capabilities';
import { MAX_IMAGE_BYTES, isAllowedImageType } from '@/lib/plugins/storage/types';

export type DraftImage =
  | { readonly kind: 'uploaded'; readonly url: string; readonly storageKey: string | null }
  | { readonly kind: 'pending'; readonly file: File; readonly previewUrl: string };

export interface VariantDraft {
  readonly id?: string | null;
  readonly size: string;
  readonly color: string;
  readonly sku: string;
  readonly stock: number;
  readonly priceOverride?: number | null;
  readonly images: readonly DraftImage[];
}

export function createEmptyVariant(baseSku: string, index: number): VariantDraft {
  const suffix = String(index + 1).padStart(2, '0');

  return {
    id: null,
    size: '',
    color: '',
    sku: baseSku ? `${baseSku}-${suffix}` : '',
    stock: 0,
    priceOverride: null,
    images: [],
  };
}

export interface VariantIssueRef {
  readonly index: number;
  readonly field: 'sku' | 'size' | 'color' | 'stock' | 'images';
  readonly message: string;
}

interface VariantEditorProps {
  readonly value: readonly VariantDraft[];
  readonly onChange: (variants: readonly VariantDraft[]) => void;
  readonly baseSku: string;
  readonly issues?: readonly VariantIssueRef[];
  readonly disabled?: boolean;
}

export function VariantEditor({
  value,
  onChange,
  baseSku,
  issues = [],
  disabled = false,
}: VariantEditorProps) {
  const issueFor = (index: number, field: VariantIssueRef['field']): string | null =>
    issues.find((issue) => issue.index === index && issue.field === field)?.message ?? null;
  const { supportsUploads } = getStorageCapabilities();
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const createdUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const createdUrls = createdUrlsRef.current;

    return () => {
      for (const url of createdUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  function update(index: number, patch: Partial<VariantDraft>): void {
    onChange(value.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  }

  function add(): void {
    onChange([...value, createEmptyVariant(baseSku, value.length)]);
  }

  function duplicate(index: number): void {
    const source = value[index];

    if (!source) {
      return;
    }

    const images = source.images.map((image): DraftImage => {
      if (image.kind === 'uploaded') {
        return image;
      }

      const previewUrl = URL.createObjectURL(image.file);
      createdUrlsRef.current.push(previewUrl);

      return { kind: 'pending', file: image.file, previewUrl };
    });

    const copy: VariantDraft = {
      ...source,
      id: null,
      sku: `${source.sku}-COPY`,
      images,
    };

    onChange([...value.slice(0, index + 1), copy, ...value.slice(index + 1)]);
  }

  function remove(index: number): void {
    for (const image of value[index]?.images ?? []) {
      if (image.kind === 'pending') {
        URL.revokeObjectURL(image.previewUrl);
      }
    }

    onChange(value.filter((_, i) => i !== index));
  }

  function handleFilesSelected(index: number, event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    const current = value[index];

    if (!current) {
      return;
    }

    const room = MAX_VARIANT_IMAGES - current.images.length;

    if (room <= 0) {
      setError(`Each variant can hold at most ${MAX_VARIANT_IMAGES} images.`);
      return;
    }

    const accepted: DraftImage[] = [];
    let rejected = 0;

    for (const file of files.slice(0, room)) {
      if (!isAllowedImageType(file.type) || file.size > MAX_IMAGE_BYTES) {
        rejected += 1;
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      createdUrlsRef.current.push(previewUrl);
      accepted.push({ kind: 'pending', file, previewUrl });
    }

    const skipped = files.length - Math.min(files.length, room);

    setError(
      rejected > 0 || skipped > 0
        ? `${rejected > 0 ? `${rejected} file(s) rejected (type or size). ` : ''}${
            skipped > 0 ? `${skipped} skipped — limit is ${MAX_VARIANT_IMAGES} per variant.` : ''
          }`.trim()
        : null,
    );

    if (accepted.length > 0) {
      update(index, { images: [...current.images, ...accepted] });
    }
  }

  function removeImage(variantIndex: number, imageIndex: number): void {
    const variant = value[variantIndex];

    if (!variant) {
      return;
    }

    const image = variant.images[imageIndex];

    if (image?.kind === 'pending') {
      URL.revokeObjectURL(image.previewUrl);
    }

    update(variantIndex, { images: variant.images.filter((_, i) => i !== imageIndex) });
  }

  return (
    <div className="flex flex-col gap-4">
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

      <ul className="flex flex-col gap-4">
        {value.map((variant, index) => (
          <li
            key={variant.id ?? `new-${index}`}
            className={
              issues.some((issue) => issue.index === index)
                ? 'border-destructive rounded-lg border p-4'
                : 'rounded-lg border p-4'
            }
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium">
                Variant {index + 1}
                {[variant.size, variant.color].filter(Boolean).length > 0
                  ? ` — ${[variant.size, variant.color].filter(Boolean).join(' · ')}`
                  : ''}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicate(index)}
                  disabled={disabled || value.length >= MAX_VARIANTS}
                >
                  <Copy aria-hidden="true" />
                  Duplicate
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={disabled || value.length <= 1}
                  aria-label={`Remove variant ${index + 1}`}
                  title={value.length <= 1 ? 'A product needs at least one variant' : undefined}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr_0.8fr_1fr]">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`variant-size-${index}`} className="text-xs">
                  Size
                </Label>
                <Input
                  id={`variant-size-${index}`}
                  value={variant.size}
                  placeholder="M"
                  onChange={(event) => update(index, { size: event.target.value })}
                  disabled={disabled}
                  aria-invalid={issueFor(index, 'size') !== null}
                />
                 {issueFor(index, 'size') ? (
                  <p className="text-destructive text-xs">{issueFor(index, 'size')}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`variant-color-${index}`} className="text-xs">
                  Colour
                </Label>
                <Input
                  id={`variant-color-${index}`}
                  value={variant.color}
                  placeholder="Navy"
                  onChange={(event) => update(index, { color: event.target.value })}
                  disabled={disabled}
                  aria-invalid={issueFor(index, 'color') !== null}
                />
                {issueFor(index, 'color') ? (
                  <p className="text-destructive text-xs">{issueFor(index, 'color')}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`variant-sku-${index}`} className="text-xs">
                  SKU
                </Label>
                <Input
                  id={`variant-sku-${index}`}
                  value={variant.sku}
                  onChange={(event) => update(index, { sku: event.target.value })}
                  disabled={disabled}
                  aria-invalid={issueFor(index, 'sku') !== null}
                />
                {issueFor(index, 'sku') ? (
                  <p className="text-destructive text-xs">{issueFor(index, 'sku')}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`variant-stock-${index}`} className="text-xs">
                  Stock
                </Label>
                <Input
                  id={`variant-stock-${index}`}
                  type="number"
                  min="0"
                  step="1"
                  value={Number.isNaN(variant.stock) ? '' : variant.stock}
                  onChange={(event) => update(index, { stock: event.target.valueAsNumber })}
                  disabled={disabled}
                  aria-invalid={issueFor(index, 'stock') !== null}
                />
                {issueFor(index, 'stock') ? (
                  <p className="text-destructive text-xs">{issueFor(index, 'stock')}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`variant-price-${index}`} className="text-xs">
                  Price override
                </Label>
                <Input
                  id={`variant-price-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Base"
                  value={variant.priceOverride ?? ''}
                  onChange={(event) =>
                    update(index, {
                      priceOverride:
                        event.target.value === '' ? null : event.target.valueAsNumber,
                    })
                  }
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <span className="text-xs font-medium">
                Images ({variant.images.length}/{MAX_VARIANT_IMAGES})
              </span>
              {issueFor(index, 'images') ? (
                <p className="text-destructive text-xs">{issueFor(index, 'images')}</p>
              ) : null}

              {variant.images.length > 0 ? (
                <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {variant.images.map((image, imageIndex) => (
                    <li
                      key={image.kind === 'pending' ? image.previewUrl : `${image.url}-${imageIndex}`}
                      className="group relative"
                    >
                      <div className="bg-muted relative aspect-square overflow-hidden rounded-md border">
                        {image.kind === 'pending' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image.previewUrl}
                            alt=""
                            className="absolute inset-0 size-full object-cover"
                          />
                        ) : (
                          <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
                        )}
                      </div>
                      {imageIndex === 0 ? (
                        <span className="bg-primary text-primary-foreground absolute top-1 left-1 rounded px-1 text-[9px] font-medium">
                          Main
                        </span>
                      ) : null}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 size-5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={() => removeImage(index, imageIndex)}
                        disabled={disabled}
                        aria-label={`Remove image ${imageIndex + 1} from variant ${index + 1}`}
                      >
                        <Trash2 className="size-2.5" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {supportsUploads ? (
                <div>
                  <input
                    ref={(element) => {
                      fileInputRefs.current[index] = element;
                    }}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                    onChange={(event) => handleFilesSelected(index, event)}
                    disabled={disabled || variant.images.length >= MAX_VARIANT_IMAGES}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={disabled || variant.images.length >= MAX_VARIANT_IMAGES}
                  >
                    <Upload aria-hidden="true" />
                    Choose images
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Set NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary to upload images.
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div>
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={disabled || value.length >= MAX_VARIANTS}
        >
          <Plus aria-hidden="true" />
          Add variant
        </Button>
        <p className="text-muted-foreground mt-2 text-xs">
          Every product needs at least one variant. Duplicate copies the fields and the images.
          Images upload when you save, and variants sharing a photo share one stored file.
        </p>
      </div>
    </div>
  );
}
