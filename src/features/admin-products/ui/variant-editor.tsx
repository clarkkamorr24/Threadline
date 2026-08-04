'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface VariantDraft {
  readonly id?: string | null;
  readonly size: string | null;
  readonly color: string | null;
  readonly sku: string;
  readonly stock: number;
  readonly priceOverride?: number | null;
}

interface VariantEditorProps {
  readonly value: readonly VariantDraft[];
  readonly onChange: (variants: readonly VariantDraft[]) => void;
  readonly baseSku: string;
  readonly disabled?: boolean;
}

const MAX_VARIANTS = 50;

export function VariantEditor({
  value,
  onChange,
  baseSku,
  disabled = false,
}: VariantEditorProps) {
  function update(index: number, patch: Partial<VariantDraft>): void {
    onChange(value.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  }

  function add(): void {
    const suffix = String(value.length + 1).padStart(2, '0');
    onChange([
      ...value,
      {
        id: null,
        size: null,
        color: null,
        sku: baseSku ? `${baseSku}-${suffix}` : '',
        stock: 0,
        priceOverride: null,
      },
    ]);
  }

  function remove(index: number): void {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      {value.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-center text-sm">
          No variants. This product sells using its base price, stock and SKU.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {value.map((variant, index) => (
            <li key={variant.id ?? `new-${index}`} className="rounded-lg border p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr_0.8fr_1fr_auto] sm:items-end">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`variant-size-${index}`} className="text-xs">
                    Size
                  </Label>
                  <Input
                    id={`variant-size-${index}`}
                    value={variant.size ?? ''}
                    placeholder="M"
                    onChange={(event) => update(index, { size: event.target.value || null })}
                    disabled={disabled}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`variant-color-${index}`} className="text-xs">
                    Colour
                  </Label>
                  <Input
                    id={`variant-color-${index}`}
                    value={variant.color ?? ''}
                    placeholder="Navy"
                    onChange={(event) => update(index, { color: event.target.value || null })}
                    disabled={disabled}
                  />
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
                  />
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
                  />
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

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={disabled}
                  aria-label={`Remove variant ${index + 1}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

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
          Each variant needs a unique SKU and at least a size or a colour. Leave price override
          blank to use the base price.
        </p>
      </div>
    </div>
  );
}
