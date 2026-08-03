import { z } from 'zod';

const MIN_PASSWORD_LENGTH = 8;

const emailField = z
  .string()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.')
  .transform((value) => value.trim().toLowerCase());

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

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
