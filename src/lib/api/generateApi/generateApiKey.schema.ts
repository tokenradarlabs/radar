import { z } from 'zod';
import { REQUIRED_ERROR, INVALID_TYPE_ERROR, INVALID_EMAIL_ERROR } from '../../utils/validation';

export const apiKeyGenerateSchema = z.object({
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
});
export type ApiKeyRequest = z.infer<typeof apiKeyGenerateSchema>;
