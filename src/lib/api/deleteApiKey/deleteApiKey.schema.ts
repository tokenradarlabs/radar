import { z } from 'zod';
import {
  REQUIRED_ERROR,
  INVALID_TYPE_ERROR,
  INVALID_EMAIL_ERROR,
  INVALID_UUID_ERROR,
} from '../../utils/validation';

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
