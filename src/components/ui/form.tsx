'use client';

import { createContext, useContext, useId } from 'react';
import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Controller, FormProvider, useFormContext, useFormState } from 'react-hook-form';
import type { ControllerProps, FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * React Hook Form bound to accessible markup.
 *
 * The contexts exist so that `FormLabel`, `FormControl` and `FormMessage` can
 * derive matching `id` / `aria-describedby` / `aria-invalid` attributes without
 * the caller wiring them by hand — the wiring is the part that silently rots,
 * and getting it wrong makes errors invisible to screen readers.
 */

interface FormFieldContextValue {
  readonly name: string;
}

interface FormItemContextValue {
  readonly id: string;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);
const FormItemContext = createContext<FormItemContextValue | null>(null);

export const Form = FormProvider;

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

function useFormField() {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext?.name });

  if (!fieldContext || !itemContext) {
    throw new Error('Form components must be used inside <FormField> and <FormItem>.');
  }

  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

export function FormItem({ className, ...props }: ComponentProps<'div'>) {
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn('flex flex-col gap-2', className)} {...props} />
    </FormItemContext.Provider>
  );
}

export function FormLabel({ className, ...props }: ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      htmlFor={formItemId}
      className={cn(error && 'text-destructive', className)}
      {...props}
    />
  );
}

export function FormControl({ ...props }: ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={Boolean(error)}
      {...props}
    />
  );
}

export function FormDescription({ className, ...props }: ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export function FormMessage({ className, children, ...props }: ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? '') : children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-destructive text-sm font-medium', className)}
      {...props}
    >
      {body}
    </p>
  );
}

/**
 * Maps server-side field issues onto the form so validation that only the
 * server can perform (uniqueness, stock) lands on the right input instead of
 * appearing as a detached banner.
 */
export function applyServerIssues<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  issues: readonly { readonly path: string; readonly message: string }[],
): void {
  for (const issue of issues) {
    if (!issue.path) {
      continue;
    }
    form.setError(issue.path as FieldPath<TFieldValues>, {
      type: 'server',
      message: issue.message,
    });
  }
}
