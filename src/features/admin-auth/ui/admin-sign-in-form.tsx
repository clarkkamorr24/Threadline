'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { SUSPENDED_MESSAGE } from '@/entities/user/model/types';
import { signInSchema } from '@/features/auth/model/schema';
import type { SignInInput } from '@/features/auth/model/schema';
import { isAppError } from '@/lib/errors';
import { getCredentialsPlugin } from '@/lib/plugins/auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { checkAdminAccessAction } from '../api/actions';

const NOT_ADMIN_MESSAGE = 'Invalid Account';

export function AdminSignInForm() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: SignInInput): Promise<void> {
    setErrorMessage(null);

    try {
      await getCredentialsPlugin().signIn(supabase, values);
    } catch (error) {
      setErrorMessage(isAppError(error) ? error.message : 'Could not sign in. Please try again.');
      return;
    }

    const result = await checkAdminAccessAction({});

    if (!result.success) {
      await supabase.auth.signOut();
      setErrorMessage(result.error.message);
      return;
    }

    if (result.data.outcome !== 'granted') {
      await supabase.auth.signOut();
      setErrorMessage(result.data.outcome === 'suspended' ? SUSPENDED_MESSAGE : NOT_ADMIN_MESSAGE);
      return;
    }

    window.location.assign(ROUTES.admin.root);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {errorMessage ? (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@admin.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full justify-center uppercase">
          Sign in
        </Button>
      </form>
    </Form>
  );
}
