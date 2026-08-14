'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  readonly src: string | null;
  readonly initials: string;
  readonly size?: number;
  readonly className?: string;
}

export function UserAvatar({ src, initials, size = 28, className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  const shared = cn('aspect-square shrink-0 rounded-full object-cover', className);
  const style = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    maxWidth: 'none' as const,
  };

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        style={style}
        className={cn(
          'bg-secondary text-secondary-foreground grid place-items-center text-xs font-medium',
          shared,
        )}
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={style}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={shared}
    />
  );
}
