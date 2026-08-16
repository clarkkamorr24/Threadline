'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ROUTES } from '@/constants/routes';

interface NavItem {
  readonly label: string;
  readonly href: string;
}

interface MobileNavProps {
  readonly items: readonly NavItem[];
}

export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="p-0">
        <SheetHeader>
          <SheetTitle>Browse</SheetTitle>
        </SheetHeader>
        <nav aria-label="Categories" className="px-3 pb-6" onClick={() => setOpen(false)}>
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href={ROUTES.products}
                className="hover:bg-accent block rounded-md px-3 py-2.5 text-sm font-medium"
              >
                All products
              </Link>
            </li>
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:bg-accent block rounded-md px-3 py-2.5 text-sm font-medium"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
