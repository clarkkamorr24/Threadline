import { FREE_SHIPPING_THRESHOLD_CENTS } from '@/constants/catalog';
import { formatMoney } from '@/utils/money';

export function ValueStrip() {
  const items = [
    `Free shipping over ${formatMoney(FREE_SHIPPING_THRESHOLD_CENTS)}`,
    '30-day returns',
    'Traceable materials',
    'Ethically made',
  ];

  return (
    <div className="border-line-strong text-ink-70 flex border-b-2 text-xs tracking-[0.06em] uppercase">
      {items.map((item, index) => (
        <div
          key={item}
          className={[
            'border-line flex flex-1 items-center gap-2.5 px-5.5 py-4',
            index < items.length - 1 ? 'border-r' : '',
            index > 0 ? 'hidden md:flex' : '',
          ].join(' ')}
        >
          <span className="bg-brand size-1.25 shrink-0 rounded-full" />
          {item}
        </div>
      ))}
    </div>
  );
}
