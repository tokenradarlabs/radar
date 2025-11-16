import { z } from 'zod';
import {
  REQUIRED_ERROR,
  INVALID_TYPE_ERROR,
  INVALID_EMAIL_ERROR,
  apiKeyScopesSchema,
  INVALID_UUID_ERROR,
} from '../../utils/validation';

export const apiKeyGenerateSchema = z.object({
  email: z
    .string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .email(INVALID_EMAIL_ERROR),
  password: z
    .string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .min(8, MIN_PASSWORD_LENGTH_ERROR)
    .regex(/[A-Z]/, PASSWORD_UPPERCASE_ERROR)
    .regex(/[0-9]/, PASSWORD_NUMBER_ERROR)
    .regex(/[^a-zA-Z0-9]/, PASSWORD_SPECIAL_CHAR_ERROR),
  expirationDuration: z.number().int().positive().optional(), // Optional duration in days
  name: z
    .string({
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .min(3, 'API key name must be at least 3 characters long')
    .max(50, 'API key name must be at most 50 characters long')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'API key name can only contain alphanumeric characters, spaces, hyphens, and underscores'
    )
    .optional(),
  scopes: apiKeyScopesSchema,
  rateLimit: z.number().int().positive().optional(),
});
export type ApiKeyRequest = z.infer<typeof apiKeyGenerateSchema>;

export const deleteApiKeyRequestSchema = z.object({
  email: z
    .string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .email(INVALID_EMAIL_ERROR),
  password: z.string({
    required_error: REQUIRED_ERROR,
    invalid_type_error: INVALID_TYPE_ERROR,
  }),
  apiKeyId: z
    .string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .uuid(INVALID_UUID_ERROR),
});

export const deleteApiKeyParamsSchema = z.object({
  id: z
    .string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .uuid(INVALID_UUID_ERROR),
});

export type DeleteApiKeyParams = z.infer<typeof deleteApiKeyParamsSchema>;

export const deleteApiKeyCombinedSchema = z.intersection(
  deleteApiKeyRequestSchema,
  z.object({ apiKeyId: deleteApiKeyParamsSchema.shape.id })
);

export type DeleteApiKeyRequest = z.infer<typeof deleteApiKeyRequestSchema>;