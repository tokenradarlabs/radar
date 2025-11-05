import { z } from 'zod';

export const supportedTokens = ['dev', 'btc', 'eth'] as const;

export const priceAlertSchema = z.object({
  tokenId: z.enum(supportedTokens),
  value: z.number().positive(),
  direction: z.enum(['up', 'down']),
  userId: z.string(),
});

export type PriceAlertParams = z.infer<typeof priceAlertSchema>;
