'use client';

import { Github } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { Button } from '@/components/ui/button';
import type { AuthProviderId } from '@/lib/plugins/auth';

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.17-2 3.44-4.95 3.44-8.55Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.45-4.75H1.71v2.98A11.5 11.5 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.67a6.9 6.9 0 0 1 0-4.42V7.27H1.71a11.51 11.51 0 0 0 0 10.38l3.84-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.71 1.23 15.1 0 12 0 7.48 0 3.57 2.6 1.71 6.38l3.84 2.98C6.46 6.78 9 4.75 12 4.75Z"
      />
    </svg>
  );
}

function MicrosoftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#F25022" d="M0 0h11.4v11.4H0z" />
      <path fill="#7FBA00" d="M12.6 0H24v11.4H12.6z" />
      <path fill="#00A4EF" d="M0 12.6h11.4V24H0z" />
      <path fill="#FFB900" d="M12.6 12.6H24V24H12.6z" />
    </svg>
  );
}

const PROVIDER_ICONS: Partial<Record<AuthProviderId, ComponentType<SVGProps<SVGSVGElement>>>> = {
  github: Github,
  google: GoogleIcon,
  azure: MicrosoftIcon,
};

interface OAuthButtonsProps {
  readonly providers: readonly { id: AuthProviderId; label: string }[];
  readonly pendingProvider: AuthProviderId | null;
  readonly disabled: boolean;
  readonly onSelect: (providerId: AuthProviderId) => void;
}

export function OAuthButtons({
  providers,
  pendingProvider,
  disabled,
  onSelect,
}: OAuthButtonsProps) {
  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="my-1.5 flex items-center gap-3.5">
        <span className="bg-line h-px flex-1" />
        <span className="text-ink-55 font-mono text-[11px] tracking-[0.08em] uppercase">or</span>
        <span className="bg-line h-px flex-1" />
      </div>

      <div className="grid gap-2">
        {providers.map((provider) => {
          const Icon = PROVIDER_ICONS[provider.id];

          return (
            <Button
              key={provider.id}
              type="button"
              variant="outline"
              isLoading={pendingProvider === provider.id}
              disabled={disabled || (pendingProvider !== null && pendingProvider !== provider.id)}
              onClick={() => onSelect(provider.id)}
              className="h-auto justify-center py-3.25"
            >
              {Icon && pendingProvider !== provider.id ? <Icon className="size-4" /> : null}
              Continue with {provider.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
