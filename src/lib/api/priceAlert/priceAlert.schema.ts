import { z } from 'zod';

export const supportedTokens = ['dev', 'btc', 'eth'] as const;

export const priceAlertSchema = z.object({
  tokenId: z.enum(supportedTokens),
  value: z.number(),
  direction: z.enum(['up', 'down'])
});

export type PriceAlertParams = z.infer<typeof priceAlertSchema>;
