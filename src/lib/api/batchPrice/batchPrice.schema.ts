import { z } from 'zod';

export const batchPriceSchema = z.object({
  tokenIds: z
    .array(z.string())
    .min(1)
    .max(10, { message: 'Maximum 10 token IDs allowed per request.' }),
});

export type BatchPriceInput = z.infer<typeof batchPriceSchema>;
