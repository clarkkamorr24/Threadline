'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, MailCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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
import { signUpFormSchema, type SignUpFormInput } from '../model/schema';
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

  const form = useForm<SignUpFormInput>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      acceptTerms: false as unknown as true,
    },
  });

  async function onSubmit(values: SignUpFormInput): Promise<void> {
    await signUp({
      name: `${values.firstName} ${values.lastName}`.trim(),
      email: values.email,
      password: values.password,
    });
  }

  if (confirmationEmail) {
    return (
      <div>
        <div className="bg-brand mb-6 grid size-16 place-items-center rounded-full">
          <MailCheck aria-hidden="true" className="size-7.5 text-white" />
        </div>
        <h1 className="font-display mb-2.5 text-[30px] font-extrabold tracking-[-0.02em] md:text-[36px]">
          Check your inbox
        </h1>
        <p className="text-ink-70 mb-7 text-[15px] leading-[1.6]">
          We sent a confirmation link to{' '}
          <strong className="text-foreground">{confirmationEmail}</strong>. Open it to finish
          setting up your account.
        </p>
        <Link
          href={ROUTES.signIn}
          className="bg-primary text-primary-foreground flex items-center justify-center px-4 py-3.75 text-[15px] font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {errorMessage ? (
        <Alert variant="destructive" className="rounded-none">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input autoComplete="given-name" placeholder="Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input autoComplete="family-name" placeholder="Dela Cruz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@email.com" {...field} />
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
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <FormLabel className="text-[13px] leading-snug font-normal">
                    I agree to the Terms and Privacy Policy.
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground mt-1 flex items-center justify-center px-4 py-3.75 text-[15px] font-medium disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
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
