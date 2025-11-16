import { z } from 'zod';

// Standardized validation messages
export const REQUIRED_ERROR = 'Field is required';
export const INVALID_TYPE_ERROR = 'Invalid field type';
export const MIN_LENGTH_ERROR = 'Field cannot be empty';
export const MAX_LENGTH_ERROR = 'Field is too long';
export const INVALID_CHARACTERS_ERROR = 'Field contains invalid characters';
export const INVALID_SELECTION_ERROR = 'Invalid selection';
export const INVALID_EMAIL_ERROR = 'Invalid email format';
export const INVALID_UUID_ERROR = 'Invalid ID format';
export const MIN_PASSWORD_LENGTH_ERROR =
  'Password must be at least 8 characters long';
export const PASSWORD_UPPERCASE_ERROR =
  'Password must contain at least one uppercase letter';
export const PASSWORD_NUMBER_ERROR =
  'Password must contain at least one number';
export const PASSWORD_SPECIAL_CHAR_ERROR =
  'Password must contain at least one special character';

// Common validation schemas
export const tokenIdSchema = z.object({
  tokenId: z
    .string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .min(1, MIN_LENGTH_ERROR)
    .max(100, MAX_LENGTH_ERROR)
    .regex(/^[a-zA-Z0-9-_]+$/, INVALID_CHARACTERS_ERROR)
    .transform((val) => val.toLowerCase().trim()),
});

// Supported tokens for price endpoint (more restrictive validation)
export const priceTokenIdSchema = z.object({
  tokenId: z
    .string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .min(1, MIN_LENGTH_ERROR)
    .transform((val) => val.toLowerCase().trim())
    .refine((val) => ['btc', 'eth', 'scout-protocol-token'].includes(val), {
      message: INVALID_SELECTION_ERROR,
    }),
});

// Type exports for TypeScript
export type TokenIdParams = z.infer<typeof tokenIdSchema>;
export type PriceTokenIdParams = z.infer<typeof priceTokenIdSchema>;
export const volumeTokenIdSchema = tokenIdSchema;
export type VolumeTokenIdParams = TokenIdParams;
export const priceChangeTokenIdSchema = tokenIdSchema;
export type PriceChangeTokenIdParams = TokenIdParams;

export const ALLOWED_API_KEY_SCOPES = [
  'read:price',
  'read:alerts',
  'write:alerts',
];

export const apiKeyScopesSchema = z
  .array(
    z.string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
  )
  .refine(
    (scopes) => scopes.every((scope) => ALLOWED_API_KEY_SCOPES.includes(scope)),
    {
      message: INVALID_SELECTION_ERROR,
    }
  )
  .default([]);

// Validation error handler
export function formatZodError(error: z.ZodError): ZodFormattedError[] {
  return error.errors.map((err) => ({
    field: err.path.length ? err.path.join('.') : 'root',
    message: err.message,
  }));
}

export type ZodFormattedError = { field: string; message: string };
