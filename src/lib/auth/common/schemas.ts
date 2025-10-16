import { z } from 'zod';

export const emailSchema = z
  .string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  })
  .email('Invalid email format');

export const passwordSchema = z.string({
  required_error: 'Password is required',
  invalid_type_error: 'Password must be a string',
});

export const strongPasswordSchema = passwordSchema
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    'Password must contain at least one special character'
  );

export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type StrongPassword = z.infer<typeof strongPasswordSchema>;
