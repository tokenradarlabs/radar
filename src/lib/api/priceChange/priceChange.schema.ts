import { z } from 'zod';

export const priceChangeTokenIdSchema = z.object({
  tokenId: z.string({
    required_error: "Token ID is required",
    invalid_type_error: "Token ID must be a string"
  })
});

export interface TokenPriceChangeParams {
  tokenId: string;
}

export interface TokenPriceChangeData {
  priceChange: number;
  tokenId: string;
  period: string;
}

export type PriceChangeTokenIdRequest = z.infer<typeof priceChangeTokenIdSchema>;
