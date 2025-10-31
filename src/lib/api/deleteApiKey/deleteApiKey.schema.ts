import { z } from 'zod';

export const deleteApiKeyRequestSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email('Invalid email format'),
  password: z.string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  }),
  apiKeyId: z
    .string({
      required_error: 'API key ID is required',
      invalid_type_error: 'API key ID must be a string',
    })
    .uuid('Invalid API key ID format'),
});

export const deleteApiKeyParamsSchema = z.object({
  id: z
    .string({
      required_error: 'API key ID is required in params',
      invalid_type_error: 'API key ID in params must be a string',
    })
    .uuid('Invalid API key ID format in params'),
});

export type DeleteApiKeyParams = z.infer<typeof deleteApiKeyParamsSchema>;

export const deleteApiKeyCombinedSchema = z.intersection(
  deleteApiKeyRequestSchema,
  z.object({ apiKeyId: deleteApiKeyParamsSchema.shape.id })
);

export type DeleteApiKeyRequest = z.infer<typeof deleteApiKeyRequestSchema>;
