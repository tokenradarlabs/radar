import { z } from 'zod';
import {
  REQUIRED_ERROR,
  INVALID_TYPE_ERROR,
  INVALID_EMAIL_ERROR,
  INVALID_UUID_ERROR,
} from '../../utils/validation';



export const getDetailedUsageAnalyticsRequestSchema = z.object({
  apiKeyId: z
    .string({
      required_error: REQUIRED_ERROR,
      invalid_type_error: INVALID_TYPE_ERROR,
    })
    .uuid(INVALID_UUID_ERROR)
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  interval: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export type GetDetailedUsageAnalyticsRequest = z.infer<
  typeof getDetailedUsageAnalyticsRequestSchema
>;

export const UsageAnalyticsResponseSchema = z.object({
  totalRequests: z.number(),
  averageResponseTime: z.number(),
  errorRate: z.number(),
  popularEndpoints: z.array(
    z.object({
      endpoint: z.string(),
      count: z.number(),
    })
  ),
  timeSeries: z
    .array(
      z.object({
        date: z.string(),
        requests: z.number(),
        errors: z.number(),
        averageResponseTime: z.number(),
      })
    )
    .optional(),
});

export type UsageAnalyticsResponse = z.infer<
  typeof UsageAnalyticsResponseSchema
>;
