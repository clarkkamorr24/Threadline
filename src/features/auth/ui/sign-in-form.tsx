'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
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
import { useAuthActions } from '../model/useAuthActions';
import { signInSchema, type SignInInput } from '../model/schema';
import { OAuthButtons } from './oauth-buttons';

interface SignInFormProps {
  readonly redirectTo: string;
  readonly initialError?: string;
}

export function SignInForm({ redirectTo, initialError }: SignInFormProps) {
  const {
    signIn,
    signInWithProvider,
    oauthProviders,
    isSubmitting,
    pendingProvider,
    errorMessage,
  } = useAuthActions({ redirectTo });

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const visibleError = errorMessage ?? initialError;

  return (
    <div className="flex flex-col gap-6">
      {visibleError ? (
        <Alert variant="destructive">
          <MailCheck aria-hidden="true" />
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(signIn)} className="flex flex-col gap-4" noValidate>
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
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            Sign in
          </Button>
        </form>
      </Form>

      <OAuthButtons
        providers={oauthProviders}
        pendingProvider={pendingProvider}
        disabled={isSubmitting}
        onSelect={signInWithProvider}
      />

      <p className="text-muted-foreground text-center text-sm">
        New here?{' '}
        <Link href={ROUTES.signUp} className="text-foreground font-medium underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
