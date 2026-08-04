'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { USER_ROLES } from '@/entities/user/model/types';
import type { UserRoleValue } from '@/entities/user/model/types';
import { useToast } from '@/hooks/useToast';
import { updateUserRoleAction } from '../api/actions';

interface UserRoleSelectProps {
  readonly userId: string;
  readonly userEmail: string;
  readonly role: UserRoleValue;
  readonly isSelf: boolean;
}

export function UserRoleSelect({ userId, userEmail, role, isSelf }: UserRoleSelectProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function handleChange(nextRole: string): void {
    if (nextRole === role) {
      return;
    }

    startTransition(async () => {
      const result = await updateUserRoleAction({ userId, role: nextRole as UserRoleValue });

      if (!result.success) {
        toast.error('Could not change role', result.error.message);
        router.refresh();
        return;
      }

      toast.success('Role updated', `${userEmail} is now ${nextRole.toLowerCase()}`);
      router.refresh();
    });
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={isSelf || isPending}>
      <SelectTrigger
        className="h-8 w-32"
        aria-label={`Role for ${userEmail}`}
        title={isSelf ? 'You cannot change your own role' : undefined}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {USER_ROLES.map((value) => (
          <SelectItem key={value} value={value}>
            {value.charAt(0) + value.slice(1).toLowerCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
