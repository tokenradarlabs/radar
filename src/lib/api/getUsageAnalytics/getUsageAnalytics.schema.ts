import { z } from 'zod';
import {
  REQUIRED_ERROR,
  INVALID_TYPE_ERROR,
  INVALID_EMAIL_ERROR,
  INVALID_UUID_ERROR,
} from '../../utils/validation';

export const getUsageAnalyticsRequestSchema = z.object({
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
    .uuid(INVALID_UUID_ERROR)
    .optional(),
});

export type GetUsageAnalyticsRequest = z.infer<
  typeof getUsageAnalyticsRequestSchema
>;
