import { z } from 'zod';
import {
  REQUIRED_ERROR,
  INVALID_TYPE_ERROR,
  INVALID_EMAIL_ERROR,
  MIN_LENGTH_ERROR,
  MAX_LENGTH_ERROR,
  INVALID_UUID_ERROR,
  apiKeyScopesSchema,
} from '../../utils/validation';

export const updateApiKeyRequestSchema = z.object({
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
  name: z
    .string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .min(1, MIN_LENGTH_ERROR)
    .max(100, MAX_LENGTH_ERROR)
    .optional(), // Make name optional for updates
  scopes: apiKeyScopesSchema,
  rateLimit: z.number().int().positive().optional(),
  expirationDuration: z.number().int().positive().optional(),
});

export const updateApiKeyParamsSchema = z.object({
  id: z
    .string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .uuid(INVALID_UUID_ERROR),
});

export type UpdateApiKeyParams = z.infer<typeof updateApiKeyParamsSchema>;

export const updateApiKeyCombinedSchema = z.intersection(
  updateApiKeyRequestSchema,
  z.object({ apiKeyId: updateApiKeyParamsSchema.shape.id })
);

export type UpdateApiKeyRequest = z.infer<typeof updateApiKeyRequestSchema>;
