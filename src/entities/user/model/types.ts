export const USER_ROLES = ['USER', 'ADMIN'] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly avatarUrl: string | null;
  readonly role: UserRoleValue;
}

export interface AdminUserRow {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly avatarUrl: string | null;
  readonly role: UserRoleValue;
  readonly orderCount: number;
  readonly totalSpentCents: number;
  readonly createdAt: string;
}

export function isAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === 'ADMIN';
}

export function getUserInitials(user: Pick<AuthenticatedUser, 'name' | 'email'>): string {
  const source = user.name?.trim() || user.email;

  const initials = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || '?';
}
