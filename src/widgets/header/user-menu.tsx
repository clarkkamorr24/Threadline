'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Heart, LayoutDashboard, LogOut, Package, User as UserIcon } from 'lucide-react';
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
import { UserAvatar } from '@/entities/user/ui/user-avatar';
import { getUserInitials } from '@/entities/user/model/types';

interface UserMenuProps {
  readonly user: AuthenticatedUser | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const signOutFormRef = useRef<HTMLFormElement>(null);

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
          <UserAvatar src={user.avatarUrl} initials={getUserInitials(user)} size={28} />
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

        {user.role === 'USER' ? (
          <DropdownMenuItem asChild>
            <Link href={ROUTES.favorites}>
              <Heart aria-hidden="true" />
              Wishlist
            </Link>
          </DropdownMenuItem>
        ) : null}

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

        <form ref={signOutFormRef} action="/auth/sign-out" method="post">
          <DropdownMenuItem
            variant="destructive"
            className="w-full"
            onSelect={(event) => {
              event.preventDefault();
              signOutFormRef.current?.requestSubmit();
            }}
          >
            <LogOut aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
