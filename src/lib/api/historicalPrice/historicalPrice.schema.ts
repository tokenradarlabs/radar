import { z } from 'zod';

export const historicalPriceSchema = z.object({
  id: z.string().min(1, 'Token ID is required'),
  days: z
    .union([
      z.literal('1'),
      z.literal('7'),
      z.literal('30'),
      z.literal('365'),
      z.literal('max'),
    ])
    .transform((val) => {
      if (val === 'max') return val;
      return parseInt(val, 10);
    })
    .optional(),
  vs_currency: z.string().min(1, 'VS Currency is required').default('usd'),
});

export type HistoricalPriceSchema = z.infer<typeof historicalPriceSchema>;
