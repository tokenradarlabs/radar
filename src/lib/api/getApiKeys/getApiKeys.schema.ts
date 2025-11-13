import { z } from 'zod';
import {
  REQUIRED_ERROR,
  INVALID_TYPE_ERROR,
  INVALID_EMAIL_ERROR,
} from '../../utils/validation';

export const getApiKeysBodySchema = z.object({
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

export const getApiKeysQuerySchema = z.object({
  page: z.preprocess(
    (val) => parseInt(z.string().parse(val), 10),
    z.number().int().positive().optional().default(1)
  ),
  limit: z.preprocess(
    (val) => parseInt(z.string().parse(val), 10),
    z.number().int().positive().optional().default(10)
  ),
});

export type GetApiKeysRequest = z.infer<typeof getApiKeysBodySchema> & z.infer<typeof getApiKeysQuerySchema>;
