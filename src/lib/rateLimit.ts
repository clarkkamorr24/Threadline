import 'server-only';
import { headers } from 'next/headers';
import { AppError } from '@/lib/errors';

const buckets = new Map<string, number[]>();
const SWEEP_AFTER = 5_000;

function sweep(now: number, windowMs: number): void {
  if (buckets.size < SWEEP_AFTER) {
    return;
  }

  for (const [key, hits] of buckets) {
    if (hits.every((hit) => now - hit >= windowMs)) {
      buckets.delete(key);
    }
  }
}

export async function clientIdentifier(): Promise<string> {
  const store = await headers();
  const forwarded = store.get('x-forwarded-for')?.split(',')[0]?.trim();

  return forwarded || store.get('x-real-ip') || 'unknown';
}

export interface RateLimitOptions {
  readonly bucket: string;
  readonly limit: number;
  readonly windowMs: number;
  readonly message?: string;
}

export async function enforceRateLimit({
  bucket,
  limit,
  windowMs,
  message = 'Too many attempts. Wait a moment and try again.',
}: RateLimitOptions): Promise<void> {
  const key = `${bucket}:${await clientIdentifier()}`;
  const now = Date.now();

  sweep(now, windowMs);

  const recent = (buckets.get(key) ?? []).filter((hit) => now - hit < windowMs);

  if (recent.length >= limit) {
    buckets.set(key, recent);
    throw new AppError('INTERNAL_ERROR', message, 429);
  }

  recent.push(now);
  buckets.set(key, recent);
}
