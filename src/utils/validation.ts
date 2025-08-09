import { z } from 'zod';

// Common validation schemas
export const tokenIdSchema = z.object({
  tokenId: z
    .string({
      required_error: 'Token ID is required',
      invalid_type_error: 'Token ID must be a string',
    })
    .min(1, 'Token ID cannot be empty')
    .max(100, 'Token ID is too long')
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'Token ID can only contain alphanumeric characters, hyphens, and underscores'
    )
    .transform((val) => val.toLowerCase().trim()),
});

// Supported tokens for price endpoint (more restrictive validation)
export const priceTokenIdSchema = z.object({
  tokenId: z
    .string({
      required_error: 'Token ID is required',
      invalid_type_error: 'Token ID must be a string',
    })
    .min(1, 'Token ID cannot be empty')
    .transform((val) => val.toLowerCase().trim())
    .refine((val) => ['btc', 'eth', 'scout-protocol-token'].includes(val), {
      message:
        'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token',
    }),
});

// Generic token validation for volume and price change endpoints
export const volumeTokenIdSchema = z.object({
  tokenId: z
    .string({
      required_error: 'Token ID is required',
      invalid_type_error: 'Token ID must be a string',
    })
    .min(1, 'Token ID cannot be empty')
    .max(100, 'Token ID is too long')
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'Token ID can only contain alphanumeric characters, hyphens, and underscores'
    )
    .transform((val) => val.toLowerCase().trim()),
});

// Type exports for TypeScript
export type TokenIdParams = z.infer<typeof tokenIdSchema>;
export type PriceTokenIdParams = z.infer<typeof priceTokenIdSchema>;
export type VolumeTokenIdParams = z.infer<typeof volumeTokenIdSchema>;

// Validation error handler
export function formatValidationError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Validation error';
}
