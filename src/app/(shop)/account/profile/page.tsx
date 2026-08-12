import type { Metadata } from 'next';
import { ROUTES } from '@/constants/routes';
import { ProfileForm } from '@/features/profile/ui/profile-form';
import { requireUserOrRedirect } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Profile',
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireUserOrRedirect(ROUTES.profile);

  return (
    <div>
      <h2 className="font-display mb-4 text-[22px] font-extrabold">Profile</h2>
      <div className="border-line max-w-xl border p-6">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
