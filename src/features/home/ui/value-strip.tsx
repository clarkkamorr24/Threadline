import type { CSSProperties } from 'react';
import { FREE_SHIPPING_THRESHOLD_CENTS } from '@/constants/catalog';
import { formatMoney } from '@/utils/money';

const MARQUEE_COPIES = 8;

export function ValueStrip() {
  const items = [
    `Free shipping over ${formatMoney(FREE_SHIPPING_THRESHOLD_CENTS)}`,
    '30-day returns',
    'Traceable materials',
    'Ethically made',
  ];

  const track = { '--marquee-offset': `-${100 / MARQUEE_COPIES}%` } as CSSProperties;

  return (
    <div className="border-line-strong text-ink-70 overflow-hidden border-b-2 text-xs tracking-[0.06em] uppercase">
      <div style={track} className="animate-marquee flex w-max hover:[animation-play-state:paused]">
        {Array.from({ length: MARQUEE_COPIES }, (_, copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy > 0 || undefined}>
            {items.map((item) => (
              <div
                key={item}
                className="border-line flex shrink-0 items-center gap-2.5 border-r px-5.5 py-4"
              >
                <span className="bg-brand size-1.25 shrink-0 rounded-full" />
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
