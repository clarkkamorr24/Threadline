'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { TONE_DOT, TONE_TEXT } from '@/entities/notification/model/types';
import type { FeedItem } from '@/entities/notification/model/types';
import { cn } from '@/lib/utils';

interface NotificationListProps {
  readonly items: readonly FeedItem[];
  readonly onDismiss: (key: string) => void;
  readonly onNavigate?: () => void;
  readonly disabled?: boolean;
  readonly compact?: boolean;
}

export function NotificationList({
  items,
  onDismiss,
  onNavigate,
  disabled,
  compact = false,
}: NotificationListProps) {
  return (
    <ul className={cn(compact && 'max-h-88 overflow-y-auto overscroll-contain')}>
      {items.map((item) => (
        <li
          key={item.key}
          className={cn(
            'border-line relative border-b last:border-b-0',
            !item.isRead && 'bg-brand/4',
          )}
        >
          <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'hover:bg-secondary/50 flex items-start gap-3 pr-10 transition-colors',
              compact ? 'py-3 pl-4' : 'px-5 py-4',
            )}
          >
            <span
              aria-hidden="true"
              style={{ borderRadius: '9999px' }}
              className={cn('mt-1.5 size-2 shrink-0', TONE_DOT[item.tone])}
            />

            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block truncate text-[13px]',
                  item.isRead ? 'font-medium' : 'font-semibold',
                )}
              >
                {item.title}
              </span>
              <span className="text-ink-55 mt-0.5 block font-mono text-[11px]">{item.detail}</span>
              <span className={cn('mt-1 block text-[11px] font-medium', TONE_TEXT[item.tone])}>
                {item.meta}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => onDismiss(item.key)}
            disabled={disabled}
            aria-label={`Remove notification: ${item.title}`}
            className="text-ink-55 hover:bg-secondary hover:text-foreground absolute top-2.5 right-2 grid size-6 place-items-center transition-colors disabled:opacity-50"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
