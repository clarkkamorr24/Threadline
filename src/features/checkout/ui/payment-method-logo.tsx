'use client';

import { useState } from 'react';

interface PaymentMethodLogoProps {
  readonly src: string;
  readonly label: string;
}

export function PaymentMethodLogo({ src, label }: PaymentMethodLogoProps) {
  const [isMissing, setIsMissing] = useState(false);

  if (isMissing) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${label} logo`}
      aria-hidden="true"
      className="h-5 w-auto max-w-16 shrink-0 object-contain"
      onError={() => setIsMissing(true)}
    />
  );
}
