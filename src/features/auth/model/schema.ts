import { z } from 'zod';

const MIN_PASSWORD_LENGTH = 8;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.');

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required.'),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required.')
    .max(80, 'Name must be 80 characters or fewer.')
    .transform((value) => value.trim()),
  email: emailField,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    .max(72, 'Password must be 72 characters or fewer.'),
});

const passwordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(72, 'Password must be 72 characters or fewer.');

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export const signUpFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(40),
  lastName: z.string().trim().min(1, 'Last name is required.').max(40),
  email: emailField,
  password: passwordField,
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Accept the terms to continue.' }),
  }),
});

export type SignUpFormInput = z.infer<typeof signUpFormSchema>;

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
