'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { setUserActiveAction } from '../api/actions';

interface UserActiveToggleProps {
  readonly userId: string;
  readonly userEmail: string;
  readonly isActive: boolean;
  readonly isSelf: boolean;
}

export function UserActiveToggle({
  userId,
  userEmail,
  isActive,
  isSelf,
}: UserActiveToggleProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function handleToggle(): void {
    startTransition(async () => {
      const result = await setUserActiveAction({ userId, isActive: !isActive });

      if (!result.success) {
        toast.error('Could not update account', result.error.message);
        return;
      }

      toast.success(isActive ? 'Account disabled' : 'Account enabled', userEmail);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={isActive ? 'ghost' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={isSelf || isPending}
      title={isSelf ? 'You cannot disable your own account' : undefined}
    >
      {isActive ? 'Disable' : 'Enable'}
    </Button>
  );
}
