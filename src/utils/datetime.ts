const STORE_TIME_ZONE = 'Asia/Manila';
const STORE_LOCALE = 'en-PH';

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(STORE_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: STORE_TIME_ZONE,
  });
}

export function formatShortDateTime(iso: string): string {
  return new Date(iso).toLocaleString(STORE_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: STORE_TIME_ZONE,
  });
}
