'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrintButton({ label = 'Print invoice' }: { readonly label?: string }) {
  return (
    <Button type="button" onClick={() => window.print()}>
      <Printer aria-hidden="true" className="size-4" />
      {label}
    </Button>
  );
}
