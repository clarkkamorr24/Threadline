'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useToast } from '@/hooks/useToast';

export function Newsletter() {
  const toast = useToast();
  const [email, setEmail] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    toast.success('Thanks for subscribing', email);
    setEmail('');
  }

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-360 items-center gap-10 px-5 py-18 lg:grid-cols-2 lg:px-10">
        <div>
          <h2 className="font-display text-[32px] leading-[0.98] font-extrabold tracking-[-0.03em] md:text-[48px]">
            Keep in the loop.
          </h2>
          <p className="mt-3.5 max-w-95 text-[15px] opacity-70">
            New arrivals, restocks and the occasional field note. No noise — one email a week at
            most.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex border border-current/40">
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              aria-label="Email address"
              className="flex-1 bg-transparent px-4.5 py-4 text-[15px] outline-none placeholder:opacity-50"
            />
            <button
              type="submit"
              className="bg-primary-foreground text-primary px-6.5 text-sm font-medium"
            >
              Subscribe
            </button>
          </div>
          <span className="font-mono text-[11px] tracking-[0.04em] opacity-55">
            By subscribing you agree to our privacy policy.
          </span>
        </form>
      </div>
    </section>
  );
}
