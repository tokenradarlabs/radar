import { z } from 'zod';

// Profile response schema
export const profileResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date(),
  _count: z.object({
    alerts: z.number(),
    apiKeys: z.number(),
  }),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
