'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  applyServerIssues,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { OrderSummary } from '@/features/cart/ui/order-summary';
import { ROUTES } from '@/constants/routes';
import type { CartTotals } from '@/entities/cart/model/types';
import { useToast } from '@/hooks/useToast';
import type { PaymentMethodOption } from '@/lib/plugins/payment/types';
import { cn } from '@/lib/utils';
import { placeOrderAction } from '../api/actions';
import { placeOrderSchema, type PlaceOrderInput } from '../model/schema';
import { PaymentMethodLogo } from './payment-method-logo';

interface CheckoutFormProps {
  readonly totals: CartTotals;
  readonly defaultName: string;
  readonly paymentMethods: readonly PaymentMethodOption[];
}

const FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'line1', label: 'Address', autoComplete: 'address-line1' },
  { name: 'line2', label: 'Apartment, suite (optional)', autoComplete: 'address-line2' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'state', label: 'State / Province (optional)', autoComplete: 'address-level1' },
  { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code' },
  { name: 'country', label: 'Country', autoComplete: 'country-name' },
  { name: 'phone', label: 'Phone (optional)', autoComplete: 'tel' },
] as const;

export function CheckoutForm({ totals, defaultName, paymentMethods }: CheckoutFormProps) {
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
        className="grid gap-10 lg:grid-cols-[1fr_360px]"
        noValidate
      >
        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">Shipping address</h2>

          {submitError ? (
            <Alert variant="destructive">
              <CircleAlert aria-hidden="true" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: controlled }) => (
                  <FormItem
                    className={
                      field.name === 'line1' || field.name === 'line2' ? 'sm:col-span-2' : undefined
                    }
                  >
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

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Payment method</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => field.onChange(method.id)}
                      disabled={isSubmitting}
                      aria-pressed={field.value === method.id}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors',
                        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                        field.value === method.id
                          ? 'border-foreground bg-accent font-medium'
                          : 'hover:border-foreground/40',
                      )}
                    >
                      <PaymentMethodLogo src={method.logoSrc} label={method.label} />
                      {method.label}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <OrderSummary totals={totals}>
            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Place order
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              You will be redirected to complete payment securely.
            </p>
          </OrderSummary>
        </aside>
      </form>
    </Form>
  );
}
