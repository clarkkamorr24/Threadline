'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { setUserActiveAction } from '../api/actions';

interface UserActiveToggleProps {
  readonly userId: string;
  readonly userEmail: string;
  readonly userName: string | null;
  readonly isActive: boolean;
}

export function UserActiveToggle({ userId, userEmail, userName, isActive }: UserActiveToggleProps) {
  const router = useRouter();
  const toast = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const label = userName?.trim() || userEmail;

  function apply(nextActive: boolean): void {
    startTransition(async () => {
      const result = await setUserActiveAction({ userId, isActive: nextActive });

      if (!result.success) {
        toast.error('Could not update account', result.error.message);
        return;
      }

      setIsConfirming(false);
      toast.success(nextActive ? 'Account restored' : 'Account suspended', userEmail);
      router.refresh();
    });
  }

  if (!isActive) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => apply(true)}
        isLoading={isPending}
      >
        Restore
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsConfirming(true)}
        disabled={isPending}
      >
        Suspend
      </Button>

      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend {label}?</DialogTitle>
            <DialogDescription>
              They will be signed out and unable to sign in again, shop, or check out until you
              restore the account. Orders they have already placed are not affected.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirming(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => apply(false)}
              isLoading={isPending}
            >
              Suspend account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
