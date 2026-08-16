export type FeedTone = 'critical' | 'warning' | 'info' | 'success';

export interface FeedItem {
  readonly key: string;
  readonly title: string;
  readonly detail: string;
  readonly meta: string;
  readonly href: string;
  readonly tone: FeedTone;
  readonly isRead: boolean;
  readonly sortAt: number;
}

export interface NotificationFeed {
  readonly items: readonly FeedItem[];
  readonly unreadCount: number;
  readonly total: number;
}

export const EMPTY_FEED: NotificationFeed = { items: [], unreadCount: 0, total: 0 };

export const TONE_DOT: Readonly<Record<FeedTone, string>> = {
  critical: 'bg-status-cancelled',
  warning: 'bg-status-processing',
  info: 'bg-status-shipped',
  success: 'bg-status-delivered',
};

export const TONE_TEXT: Readonly<Record<FeedTone, string>> = {
  critical: 'text-status-cancelled',
  warning: 'text-status-processing',
  info: 'text-status-shipped',
  success: 'text-status-delivered',
};
