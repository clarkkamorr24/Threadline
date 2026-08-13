import { cn } from '@/lib/utils';

interface PercentBarProps {
  readonly label: string;
  readonly value: string;
  readonly percent: number;
  readonly accent?: boolean;
}

export function PercentBar({ label, value, percent, accent = false }: PercentBarProps) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[13px]">
        <span>{label}</span>
        <span className="text-ink-70 font-mono">{value}</span>
      </div>
      <div className="bg-secondary h-1.75">
        <div
          className={cn('h-full', accent ? 'bg-brand' : 'bg-ink')}
          style={{ width: `${Math.max(Math.min(percent, 100), 0)}%` }}
        />
      </div>
    </div>
  );
}
