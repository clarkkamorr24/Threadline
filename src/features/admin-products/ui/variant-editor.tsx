'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ChevronRight, Copy, GripVertical, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MAX_VARIANTS, MAX_VARIANT_IMAGES } from '@/constants/catalog';
import { getStorageCapabilities } from '@/lib/plugins/storage/capabilities';
import { MAX_IMAGE_BYTES, isAllowedImageType } from '@/lib/plugins/storage/types';
import { cn } from '@/lib/utils';
import { resolveSwatch, titleCaseColor } from '@/utils/colors';
import { ColorSelect } from './color-select';

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

const UNGROUPED = '__none__';

interface ColorGroup {
  readonly key: string;
  readonly label: string;
  readonly swatch: string | null;
  readonly indices: readonly number[];
}

function colorKey(color: string): string {
  return color.trim().toLowerCase() || UNGROUPED;
}

function groupByColor(variants: readonly VariantDraft[]): readonly ColorGroup[] {
  const groups = new Map<string, number[]>();

  variants.forEach((variant, index) => {
    const key = colorKey(variant.color);
    const existing = groups.get(key);

    if (existing) {
      existing.push(index);
    } else {
      groups.set(key, [index]);
    }
  });

  return [...groups.entries()].map(([key, indices]) => ({
    key,
    label: key === UNGROUPED ? 'No colour set' : titleCaseColor(key),
    swatch: key === UNGROUPED ? null : resolveSwatch(key),
    indices,
  }));
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
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const groupInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetRef = useRef<{ groupKey: string; imageIndex: number } | null>(null);
  const createdUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const createdUrls = createdUrlsRef.current;

    return () => {
      for (const url of createdUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const groups = groupByColor(value);

  function groupHasIssues(group: ColorGroup): boolean {
    return group.indices.some((index) => issues.some((issue) => issue.index === index));
  }

  function isOpen(group: ColorGroup): boolean {
    return toggled[group.key] ?? (groups.length === 1 || groupHasIssues(group));
  }

  function toggleGroup(group: ColorGroup): void {
    const next = !isOpen(group);
    setToggled((current) => ({ ...current, [group.key]: next }));
  }

  function update(index: number, patch: Partial<VariantDraft>): void {
    onChange(value.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  }

  function imagesForKey(key: string): readonly DraftImage[] {
    return value.find((variant) => colorKey(variant.color) === key)?.images ?? [];
  }

  function groupImages(group: ColorGroup): readonly DraftImage[] {
    return value[group.indices[0] ?? 0]?.images ?? [];
  }

  /** Images belong to the colour, so every size in the group carries the same set. */
  function setGroupImages(group: ColorGroup, images: readonly DraftImage[]): void {
    const members = new Set(group.indices);

    onChange(value.map((variant, i) => (members.has(i) ? { ...variant, images } : variant)));
  }

  function changeColor(index: number, next: string): void {
    const target = colorKey(next);
    const adopted = value.some((variant, i) => i !== index && colorKey(variant.color) === target)
      ? imagesForKey(target)
      : (value[index]?.images ?? []);

    update(index, { color: next, images: adopted });
  }

  function add(color = ''): void {
    const images = color ? imagesForKey(colorKey(color)) : [];

    onChange([...value, { ...createEmptyVariant(baseSku, value.length), color, images }]);
  }

  function reorderGroups(from: number, to: number): void {
    if (from === to || to < 0 || to >= groups.length) {
      return;
    }

    const order = groups.map((group) => group.indices);
    const [moved] = order.splice(from, 1);

    if (!moved) {
      return;
    }

    order.splice(to, 0, moved);

    onChange(order.flat().flatMap((index) => (value[index] ? [value[index]] : [])));
  }

  function moveGroup(from: number, direction: -1 | 1): void {
    reorderGroups(from, from + direction);
  }

  function dropOn(targetIndex: number): void {
    const from = groups.findIndex((group) => group.key === draggingKey);

    setDraggingKey(null);
    setOverKey(null);

    if (from >= 0) {
      reorderGroups(from, targetIndex);
    }
  }

  function duplicate(index: number): void {
    const source = value[index];

    if (!source) {
      return;
    }

    const copy: VariantDraft = {
      ...source,
      id: null,
      sku: `${source.sku}-COPY`,
    };

    onChange([...value.slice(0, index + 1), copy, ...value.slice(index + 1)]);
  }

  function remove(index: number): void {
    onChange(value.filter((_, i) => i !== index));
  }

  function toPendingImage(file: File): DraftImage | null {
    if (!isAllowedImageType(file.type) || file.size > MAX_IMAGE_BYTES) {
      return null;
    }

    const previewUrl = URL.createObjectURL(file);
    createdUrlsRef.current.push(previewUrl);

    return { kind: 'pending', file, previewUrl };
  }

  function handleFilesSelected(group: ColorGroup, event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    const current = groupImages(group);
    const room = MAX_VARIANT_IMAGES - current.length;

    if (room <= 0) {
      setError(`Each colour can hold at most ${MAX_VARIANT_IMAGES} images.`);
      return;
    }

    const accepted: DraftImage[] = [];
    let rejected = 0;

    for (const file of files.slice(0, room)) {
      const image = toPendingImage(file);

      if (image) {
        accepted.push(image);
      } else {
        rejected += 1;
      }
    }

    const skipped = files.length - Math.min(files.length, room);

    setError(
      rejected > 0 || skipped > 0
        ? `${rejected > 0 ? `${rejected} file(s) rejected (type or size). ` : ''}${
            skipped > 0 ? `${skipped} skipped — limit is ${MAX_VARIANT_IMAGES} per colour.` : ''
          }`.trim()
        : null,
    );

    if (accepted.length > 0) {
      setGroupImages(group, [...current, ...accepted]);
    }
  }

  function startReplace(groupKey: string, imageIndex: number): void {
    replaceTargetRef.current = { groupKey, imageIndex };
    replaceInputRef.current?.click();
  }

  function handleReplaceSelected(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';

    const target = replaceTargetRef.current;
    replaceTargetRef.current = null;

    if (!file || !target) {
      return;
    }

    const group = groups.find((candidate) => candidate.key === target.groupKey);
    const current = group ? groupImages(group) : [];
    const existing = current[target.imageIndex];

    if (!group || !existing) {
      return;
    }

    const replacement = toPendingImage(file);

    if (!replacement) {
      setError('That file was rejected — check the file type and size.');
      return;
    }

    if (existing.kind === 'pending') {
      URL.revokeObjectURL(existing.previewUrl);
    }

    setError(null);
    setGroupImages(
      group,
      current.map((image, i) => (i === target.imageIndex ? replacement : image)),
    );
  }

  function removeImage(group: ColorGroup, imageIndex: number): void {
    const current = groupImages(group);
    const image = current[imageIndex];

    if (image?.kind === 'pending') {
      URL.revokeObjectURL(image.previewUrl);
    }

    setGroupImages(
      group,
      current.filter((_, i) => i !== imageIndex),
    );
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

      {supportsUploads ? (
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={handleReplaceSelected}
          disabled={disabled}
        />
      ) : null}

      <ul className="flex flex-col gap-3">
        {groups.map((group, groupIndex) => {
          const open = isOpen(group);
          const hasIssues = groupHasIssues(group);
          const images = groupImages(group);
          const imageIssue = group.indices
            .map((index) => issueFor(index, 'images'))
            .find((message) => message !== null);
          const units = group.indices.reduce((sum, index) => {
            const stock = value[index]?.stock;
            return sum + (typeof stock === 'number' && !Number.isNaN(stock) ? stock : 0);
          }, 0);

          return (
            <li
              key={group.key}
              onDragOver={(event) => {
                if (draggingKey && draggingKey !== group.key) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setOverKey(group.key);
                }
              }}
              onDragLeave={() => setOverKey((current) => (current === group.key ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                dropOn(groupIndex);
              }}
              className={cn(
                'rounded-lg border transition-colors',
                hasIssues && 'border-destructive',
                draggingKey === group.key && 'opacity-50',
                overKey === group.key && draggingKey !== group.key && 'border-brand bg-brand/4',
              )}
            >
              <div className="flex items-center gap-1 pr-3">
                <span
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  draggable={!disabled}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', group.key);
                    setDraggingKey(group.key);
                  }}
                  onDragEnd={() => {
                    setDraggingKey(null);
                    setOverKey(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      moveGroup(groupIndex, -1);
                    }
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      moveGroup(groupIndex, 1);
                    }
                  }}
                  aria-label={`Reorder ${group.label}, position ${groupIndex + 1} of ${groups.length}. Drag, or press the arrow keys.`}
                  title="Drag to reorder — this is the order shoppers see"
                  className={cn(
                    'text-muted-foreground hover:text-foreground focus-visible:ring-ring grid size-8 shrink-0 place-items-center rounded-md focus-visible:ring-2 focus-visible:outline-none',
                    disabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-grab active:cursor-grabbing',
                  )}
                >
                  <GripVertical aria-hidden="true" className="size-4" />
                </span>
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  aria-expanded={open}
                  className="hover:bg-secondary/40 flex flex-1 items-center gap-3 px-4 py-3 text-left transition-colors"
                >
                  <ChevronRight
                    aria-hidden="true"
                    className={cn(
                      'text-muted-foreground size-4 shrink-0 transition-transform',
                      open && 'rotate-90',
                    )}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      backgroundColor: group.swatch ?? 'transparent',
                      borderRadius: '9999px',
                    }}
                    className={cn(
                      'border-line-strong size-4 shrink-0 border',
                      group.swatch === null && 'border-dashed',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{group.label}</span>
                    <span className="text-muted-foreground block font-mono text-[11px]">
                      {group.indices.length} size{group.indices.length === 1 ? '' : 's'} · {units}{' '}
                      unit{units === 1 ? '' : 's'} · {images.length} image
                      {images.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  {hasIssues ? (
                    <span className="text-destructive text-xs font-medium">Needs attention</span>
                  ) : null}
                </button>

                <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                  {groupIndex + 1}
                </span>
              </div>

              {open ? (
                <div className="flex flex-col gap-4 border-t p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs font-medium">
                        Images for {group.label} ({images.length}/{MAX_VARIANT_IMAGES})
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        Shared by every size in this colour
                      </span>
                    </div>

                    {imageIssue ? <p className="text-destructive text-xs">{imageIssue}</p> : null}

                    {images.length > 0 ? (
                      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {images.map((image, imageIndex) => (
                          <li
                            key={
                              image.kind === 'pending'
                                ? image.previewUrl
                                : `${image.url}-${imageIndex}`
                            }
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
                                <Image
                                  src={image.url}
                                  alt=""
                                  fill
                                  sizes="96px"
                                  className="object-cover"
                                />
                              )}
                            </div>

                            {imageIndex === 0 ? (
                              <span className="bg-primary text-primary-foreground absolute top-1 left-1 px-1 text-[9px] font-medium">
                                Main
                              </span>
                            ) : null}

                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                              {supportsUploads ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="size-5"
                                  onClick={() => startReplace(group.key, imageIndex)}
                                  disabled={disabled}
                                  aria-label={`Replace image ${imageIndex + 1} for ${group.label}`}
                                  title="Replace image"
                                >
                                  <RefreshCw className="size-2.5" aria-hidden="true" />
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="size-5"
                                onClick={() => removeImage(group, imageIndex)}
                                disabled={disabled}
                                aria-label={`Remove image ${imageIndex + 1} from ${group.label}`}
                                title="Remove image"
                              >
                                <Trash2 className="size-2.5" aria-hidden="true" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {supportsUploads ? (
                      <div>
                        <input
                          ref={(element) => {
                            groupInputRefs.current[group.key] = element;
                          }}
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="sr-only"
                          onChange={(event) => handleFilesSelected(group, event)}
                          disabled={disabled || images.length >= MAX_VARIANT_IMAGES}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => groupInputRefs.current[group.key]?.click()}
                          disabled={disabled || images.length >= MAX_VARIANT_IMAGES}
                        >
                          <Upload aria-hidden="true" />
                          {images.length > 0 ? 'Add more images' : 'Choose images'}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        Set NEXT_PUBLIC_STORAGE_PROVIDER=cloudinary to upload images.
                      </p>
                    )}
                  </div>

                  {group.indices.map((index) => {
                    const variant = value[index];

                    if (!variant) {
                      return null;
                    }

                    return (
                      <div
                        key={variant.id ?? `new-${index}`}
                        className={cn(
                          'rounded-lg border p-4',
                          issues.some(
                            (issue) => issue.index === index && issue.field !== 'images',
                          ) && 'border-destructive',
                        )}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {variant.size ? `Size ${variant.size}` : `Variant ${index + 1}`}
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
                              title={
                                value.length <= 1
                                  ? 'A product needs at least one variant'
                                  : undefined
                              }
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
                            <ColorSelect
                              id={`variant-color-${index}`}
                              value={variant.color}
                              onChange={(next) => changeColor(index, next)}
                              disabled={disabled}
                              invalid={issueFor(index, 'color') !== null}
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
                              onChange={(event) =>
                                update(index, { stock: event.target.valueAsNumber })
                              }
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
                      </div>
                    );
                  })}

                  {group.key !== UNGROUPED ? (
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => add(group.label)}
                        disabled={disabled || value.length >= MAX_VARIANTS}
                      >
                        <Plus aria-hidden="true" />
                        Add size to {group.label}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => add()}
          disabled={disabled || value.length >= MAX_VARIANTS}
        >
          <Plus aria-hidden="true" />
          Add variant
        </Button>
        <p className="text-muted-foreground mt-2 text-xs">
          Images belong to the colour, so every size in a group shares one set. Drag a colour by its
          handle to reorder it — that is the order shoppers see on the product page.
        </p>
      </div>
    </div>
  );
}
