'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, MailCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { describeSignInMethodAction } from '../api/actions';
import { useAuthActions } from '../model/useAuthActions';
import { signInSchema, type SignInInput } from '../model/schema';
import { OAuthButtons } from './oauth-buttons';

interface SignInFormProps {
  readonly redirectTo: string;
}

export function SignInForm({ redirectTo }: SignInFormProps) {
  const {
    signIn,
    signInWithProvider,
    oauthProviders,
    isSubmitting,
    pendingProvider,
    errorMessage,
  } = useAuthActions({ redirectTo });

  const [oauthHint, setOauthHint] = useState<string | null>(null);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: SignInInput): Promise<void> {
    setOauthHint(null);

    const signedIn = await signIn(values);

    if (signedIn) {
      return;
    }

    const hint = await describeSignInMethodAction({ email: values.email });

    if (hint.success && hint.data.oauthOnly) {
      setOauthHint(hint.data.providerLabel);
    }
  }

  const visibleError = oauthHint ? null : errorMessage;

  return (
    <div className="flex flex-col gap-6">
      {oauthHint ? (
        <Alert className="border-brand text-brand rounded-none">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>
            This account was created with {oauthHint}. Use “Continue with {oauthHint}” below
            instead of a password.
          </AlertDescription>
        </Alert>
      ) : null}

      {visibleError ? (
        <Alert variant="destructive">
          <MailCheck aria-hidden="true" />
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...field}
                  />
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
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Link
              href={ROUTES.forgotPassword}
              className="text-brand text-[13px] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground mt-1 flex items-center justify-center px-4 py-3.75 text-[15px] font-medium disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </Form>

      <OAuthButtons
        providers={oauthProviders}
        pendingProvider={pendingProvider}
        disabled={isSubmitting}
        onSelect={signInWithProvider}
      />

      <Link
        href={ROUTES.home}
        className="text-ink-70 hover:text-foreground flex justify-center py-2 text-sm transition-colors"
      >
        ← Back to store
      </Link>
    </div>
  );
}
