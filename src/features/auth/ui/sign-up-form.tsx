'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, MailCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { useAuthActions } from '../model/useAuthActions';
import { signUpSchema, type SignUpInput } from '../model/schema';
import { OAuthButtons } from './oauth-buttons';

interface SignUpFormProps {
  readonly redirectTo: string;
}

export function SignUpForm({ redirectTo }: SignUpFormProps) {
  const {
    signUp,
    signInWithProvider,
    oauthProviders,
    isSubmitting,
    pendingProvider,
    errorMessage,
    confirmationEmail,
  } = useAuthActions({ redirectTo });

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  if (confirmationEmail) {
    return (
      <Alert variant="success">
        <MailCheck aria-hidden="true" />
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>
          We sent a confirmation link to {confirmationEmail}. Open it to finish setting up your
          account.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {errorMessage ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(signUp)} className="flex flex-col gap-4" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" placeholder="Alex Morgan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormDescription>At least 8 characters.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            Create account
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
        Already have an account?{' '}
        <Link href={ROUTES.signIn} className="text-foreground font-medium underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
