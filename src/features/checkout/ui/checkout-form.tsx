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
import { placeOrderAction } from '../api/actions';
import { shippingAddressSchema, type ShippingAddressInput } from '../model/schema';

interface CheckoutFormProps {
  readonly totals: CartTotals;
  readonly defaultName: string;
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

export function CheckoutForm({ totals, defaultName }: CheckoutFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ShippingAddressInput>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      fullName: defaultName,
      line1: '',
      line2: null,
      city: '',
      state: null,
      postalCode: '',
      country: '',
      phone: null,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: ShippingAddressInput): Promise<void> {
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

    toast.success('Order placed', `Order ${result.data.orderNumber}`);
    router.push(ROUTES.order(result.data.orderId));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-10 lg:grid-cols-[1fr_360px]" noValidate>
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
                    className={field.name === 'line1' || field.name === 'line2' ? 'sm:col-span-2' : undefined}
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
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <OrderSummary totals={totals}>
            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Place order
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              No payment is taken — this store runs the manual payment provider.
            </p>
          </OrderSummary>
        </aside>
      </form>
    </Form>
  );
}
