'use client';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { KNOWN_COLOR_NAMES, resolveSwatch, titleCaseColor } from '@/utils/colors';

interface ColorSelectProps {
  readonly id: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
}

function Swatch({ hex, className }: { readonly hex: string | null; readonly className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: hex ?? 'transparent', borderRadius: '9999px' }}
      className={cn(
        'border-line-strong block size-4 shrink-0 border',
        hex === null && 'border-dashed',
        className,
      )}
    />
  );
}

export function ColorSelect({ id, value, onChange, disabled, invalid }: ColorSelectProps) {
  const normalised = value.trim().toLowerCase();
  const matched = KNOWN_COLOR_NAMES.includes(normalised) ? normalised : '';

  return (
    <Select
      value={matched}
      onValueChange={(next) => onChange(titleCaseColor(next))}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-invalid={invalid} className="w-full">
        <span style={{ display: 'flex' }} className="min-w-0 items-center gap-2">
          <Swatch hex={resolveSwatch(value)} />
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? titleCaseColor(value) : 'Select a colour'}
          </span>
        </span>
      </SelectTrigger>

      <SelectContent className="max-h-72">
        {KNOWN_COLOR_NAMES.map((name) => (
          <SelectItem key={name} value={name}>
            <span className="flex items-center gap-2">
              <Swatch hex={resolveSwatch(name)} />
              {titleCaseColor(name)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
