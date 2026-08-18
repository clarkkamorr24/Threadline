'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { enforceRateLimit } from '@/lib/rateLimit';
import { createAction } from '@/lib/serverAction';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AdminAccessOutcome = 'granted' | 'not-admin' | 'suspended' | 'no-session';

export const checkAdminAccessAction = createAction(
  'adminAuth.checkAccess',
  z.object({}),
  async (): Promise<{ outcome: AdminAccessOutcome }> => {
    await enforceRateLimit({ bucket: 'admin.accessCheck', limit: 10, windowMs: 60_000 });

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { outcome: 'no-session' };
    }

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true, isActive: true },
    });

    if (!profile || profile.role !== 'ADMIN') {
      return { outcome: 'not-admin' };
    }

    if (!profile.isActive) {
      return { outcome: 'suspended' };
    }

    return { outcome: 'granted' };
  },
);
