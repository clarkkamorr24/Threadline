'use client';

import Link from 'next/link';
import { LayoutDashboard, LogOut, Package, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants/routes';
import type { AuthenticatedUser } from '@/entities/user/model/types';
import { getUserInitials } from '@/entities/user/model/types';

interface UserMenuProps {
  readonly user: AuthenticatedUser | null;
}

export function UserMenu({ user }: UserMenuProps) {
  if (!user) {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href={ROUTES.signIn}>Sign in</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <span className="bg-secondary text-secondary-foreground flex size-7 items-center justify-center rounded-full text-xs font-medium">
            {getUserInitials(user)}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{user.name ?? 'Your account'}</span>
          <span className="text-muted-foreground truncate text-xs font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={ROUTES.orders}>
            <Package aria-hidden="true" />
            Your orders
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={ROUTES.account}>
            <UserIcon aria-hidden="true" />
            Account
          </Link>
        </DropdownMenuItem>
        {user.role === 'ADMIN' ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={ROUTES.admin.root}>
                <LayoutDashboard aria-hidden="true" />
                Admin
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild variant="destructive">
          <form action="/auth/sign-out" method="post" className="w-full">
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
