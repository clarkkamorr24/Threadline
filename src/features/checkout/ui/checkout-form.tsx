'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, ImageOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  applyServerIssues,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import type { CartLineItem, CartTotals } from '@/entities/cart/model/types';
import { useToast } from '@/hooks/useToast';
import type { PaymentMethodOption } from '@/lib/plugins/payment/types';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/utils/money';
import { placeOrderAction } from '../api/actions';
import { placeOrderSchema, type PlaceOrderInput } from '../model/schema';
import { PaymentMethodLogo } from './payment-method-logo';

interface CheckoutFormProps {
  readonly totals: CartTotals;
  readonly items: readonly CartLineItem[];
  readonly defaultName: string;
  readonly email: string;
  readonly paymentMethods: readonly PaymentMethodOption[];
}

const ADDRESS_FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name', wide: true },
  { name: 'line1', label: 'Address', autoComplete: 'address-line1', wide: true },
  { name: 'line2', label: 'Apartment, suite (optional)', autoComplete: 'address-line2', wide: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2', wide: false },
  { name: 'state', label: 'Province / State (optional)', autoComplete: 'address-level1', wide: false },
  { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code', wide: false },
  { name: 'country', label: 'Country', autoComplete: 'country-name', wide: false },
] as const;

export function CheckoutForm({
  totals,
  items,
  defaultName,
  email,
  paymentMethods,
}: CheckoutFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<PlaceOrderInput>({
    resolver: zodResolver(placeOrderSchema),
    defaultValues: {
      fullName: defaultName,
      line1: '',
      line2: null,
      city: '',
      state: null,
      postalCode: '',
      country: 'Philippines',
      phone: null,
      paymentMethod: paymentMethods[0]?.id,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: PlaceOrderInput): Promise<void> {
    setSubmitError(null);

    const result = await placeOrderAction(values);

    if (!result.success) {
      if (result.error.issues.length > 0) {
        applyServerIssues(form, result.error.issues);
      } else {
        setSubmitError(result.error.message);
      }
      return;
    }

    if (result.data.redirectUrl) {
      window.location.assign(result.data.redirectUrl);
      return;
    }

    if (result.data.paymentError) {
      toast.error('Order saved, payment not started', result.data.paymentError);
    } else {
      toast.success('Order placed', `Order ${result.data.orderNumber}`);
    }

    router.push(ROUTES.order(result.data.orderId));
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="border-line-strong grid border-t-2 lg:grid-cols-[1fr_400px]"
        noValidate
      >
        <div className="border-line-strong pt-8 pb-10 lg:border-r-2 lg:pr-10">
          {submitError ? (
            <Alert variant="destructive" className="mb-6 rounded-none">
              <CircleAlert aria-hidden="true" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <section className="mb-9">
            <h2 className="font-display mb-4 text-[22px] font-extrabold">Contact</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">Email</span>
                <div className="border-line bg-secondary text-ink-70 flex h-9 items-center border px-3 text-sm">
                  {email}
                </div>
              </div>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="tel"
                        placeholder="+63 9XX XXX XXXX"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="mb-9">
            <h2 className="font-display mb-4 text-[22px] font-extrabold">Shipping address</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              {ADDRESS_FIELDS.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: controlled }) => (
                    <FormItem className={field.wide ? 'sm:col-span-2' : undefined}>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete={field.autoComplete}
                          {...controlled}
                          value={controlled.value ?? ''}
                          onChange={(event) => controlled.onChange(event.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display mb-4 text-[22px] font-extrabold">Payment</h2>
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-col gap-2.5">
                    {paymentMethods.map((method) => {
                      const isSelected = field.value === method.id;

                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => field.onChange(method.id)}
                          disabled={isSubmitting}
                          aria-pressed={isSelected}
                          className={cn(
                            'border-line flex items-center gap-3.5 border px-[18px] py-4 text-left transition-colors',
                            isSelected
                              ? 'border-foreground shadow-[inset_0_0_0_1px_var(--ink)]'
                              : 'hover:border-line-strong',
                          )}
                        >
                          <span
                            className={cn(
                              'border-line-strong grid size-4 shrink-0 place-items-center rounded-full border',
                              isSelected && 'border-foreground',
                            )}
                          >
                            {isSelected ? (
                              <span className="bg-foreground size-2 rounded-full" />
                            ) : null}
                          </span>
                          <PaymentMethodLogo src={method.logoSrc} label={method.label} />
                          <span className="flex-1">
                            <span className="block text-sm font-semibold">{method.label}</span>
                            <span className="text-ink-55 block font-mono text-[11px]">
                              Redirects to {method.label} to authorise payment
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground mt-6 flex w-full items-center justify-center px-4 py-[17px] text-[15px] font-medium disabled:opacity-60"
            >
              {isSubmitting
                ? 'Placing order…'
                : `Place order · ${formatMoney(totals.totalCents)}`}
            </button>
          </section>
        </div>

        <aside className="self-start py-8 lg:sticky lg:top-24 lg:pl-9">
          <h2 className="font-display mb-[18px] text-base font-extrabold">
            Order summary ({items.length})
          </h2>

          <ul className="mb-5 flex max-h-[280px] flex-col gap-3.5 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3.5">
                <div className="relative h-[70px] w-14 shrink-0 overflow-hidden bg-[#e6e4e1]">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-ink-55 grid h-full place-items-center">
                      <ImageOff aria-hidden="true" className="size-4" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-tight font-semibold">{item.name}</div>
                  <div className="text-ink-55 mt-1 font-mono text-[11px]">
                    {[item.size, item.color].filter(Boolean).join(' · ')} · Qty {item.quantity}
                  </div>
                </div>
                <div className="text-sm whitespace-nowrap">
                  {formatMoney(item.lineTotalCents)}
                </div>
              </li>
            ))}
          </ul>

          <dl className="border-line text-ink-70 flex flex-col gap-2.5 border-t pt-[18px] text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="text-foreground">{formatMoney(totals.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd className="text-foreground">
                {totals.shippingCents === 0 ? 'Free' : formatMoney(totals.shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Tax</dt>
              <dd className="text-foreground">{formatMoney(totals.taxCents)}</dd>
            </div>
          </dl>

          <div className="border-line-strong mt-3.5 flex items-baseline justify-between border-t-2 pt-[18px]">
            <span className="font-display text-lg font-extrabold">Total</span>
            <span className="font-display text-2xl font-extrabold">
              {formatMoney(totals.totalCents)}
            </span>
          </div>

          <p className="text-ink-55 mt-3 text-center font-mono text-[11px]">
            You will be redirected to complete payment securely.
          </p>
        </aside>
      </form>
    </Form>
  );
}
