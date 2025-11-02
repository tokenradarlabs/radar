import { z } from 'zod';
import {
  REQUIRED_ERROR,
  INVALID_TYPE_ERROR,
  INVALID_EMAIL_ERROR,
  MIN_PASSWORD_LENGTH_ERROR,
  PASSWORD_UPPERCASE_ERROR,
  PASSWORD_NUMBER_ERROR,
  PASSWORD_SPECIAL_CHAR_ERROR,
} from '../../../src/utils/validation';

export const emailSchema = z
  .string({
    required_error: REQUIRED_ERROR,
    invalid_type_error: INVALID_TYPE_ERROR,
  })
  .email(INVALID_EMAIL_ERROR);

export const passwordSchema = z.string({
  required_error: REQUIRED_ERROR,
  invalid_type_error: INVALID_TYPE_ERROR,
});

export const strongPasswordSchema = passwordSchema
  .min(8, MIN_PASSWORD_LENGTH_ERROR)
  .regex(/[A-Z]/, PASSWORD_UPPERCASE_ERROR)
  .regex(/[0-9]/, PASSWORD_NUMBER_ERROR)
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    PASSWORD_SPECIAL_CHAR_ERROR
  );

export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type StrongPassword = z.infer<typeof strongPasswordSchema>;
