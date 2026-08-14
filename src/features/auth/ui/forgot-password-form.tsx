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
import { useAuthActions } from '../model/useAuthActions';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../model/schema';

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { requestPasswordReset, isSubmitting, errorMessage } = useAuthActions({
    redirectTo: ROUTES.signIn,
  });

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput): Promise<void> {
    const ok = await requestPasswordReset(values.email);

    if (ok) {
      setSentTo(values.email);
    }
  }

  if (sentTo) {
    return (
      <div>
        <div className="bg-brand mb-6 grid size-16 place-items-center rounded-full">
          <MailCheck aria-hidden="true" className="size-7.5 text-white" />
        </div>
        <h1 className="font-display mb-2.5 text-[30px] font-extrabold tracking-[-0.02em] md:text-[36px]">
          Check your inbox
        </h1>
        <p className="text-ink-70 mb-7 text-[15px] leading-[1.6]">
          If an account exists for that email, we&apos;ve sent a link to reset your password. The
          link expires after a short while.
        </p>
        <Link
          href={ROUTES.signIn}
          className="bg-primary text-primary-foreground flex items-center justify-center px-4 py-3.75 text-[15px] font-medium"
        >
          Back to sign in
        </Link>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="text-ink-70 hover:text-foreground mt-2.5 flex w-full justify-center py-3 text-sm transition-colors"
        >
          Didn&apos;t get it? Resend
        </button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {errorMessage ? (
          <Alert variant="destructive" className="rounded-none">
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
                <Input type="email" autoComplete="email" placeholder="you@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground flex items-center justify-center px-4 py-3.75 text-[15px] font-medium disabled:opacity-60"
        >
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>

        <Link
          href={ROUTES.signIn}
          className="text-ink-70 hover:text-foreground text-center text-sm"
        >
          ← Back to sign in
        </Link>
      </form>
    </Form>
  );
}
