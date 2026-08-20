'use client';

import { useState } from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import { paymentAsset, paymentMethodLabel } from '@/entities/order/model/payment';
import { cn } from '@/lib/utils';

const CARD_METHODS = ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay'];

const PAYMENT_ICONS: Readonly<Record<string, typeof Wallet>> = {
  ...Object.fromEntries(CARD_METHODS.map((brand) => [brand, CreditCard])),
  card: CreditCard,
  link: CreditCard,
  gcash: Wallet,
  paymaya: Wallet,
};

interface PaymentMarkProps {
  readonly method: string | null;
  readonly provider: string | null;
  readonly height?: number;
  readonly hideLabel?: boolean;
  readonly className?: string;
}

export function PaymentMark({
  method,
  provider,
  height = 18,
  hideLabel = false,
  className,
}: PaymentMarkProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  const label = paymentMethodLabel(method, provider);
  const asset = paymentAsset(method);

  if (!label) {
    return <span className={cn('text-ink-55', className)}>—</span>;
  }

  if (asset && !logoFailed) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 align-middle', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/payments/${asset.file}`}
          alt={asset.hasWordmark || hideLabel ? label : ''}
          style={{ height }}
          onError={() => setLogoFailed(true)}
          className="w-auto shrink-0"
        />
        {asset.hasWordmark || hideLabel ? null : (
          <span className="leading-none font-medium">{label}</span>
        )}
      </span>
    );
  }

  const Icon = (method && PAYMENT_ICONS[method]) || Wallet;

  return (
    <span
      className={cn(
        'border-line inline-flex items-center gap-1.5 border px-2 py-1 text-[12px] leading-none font-medium',
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {label}
    </span>
  );
}
