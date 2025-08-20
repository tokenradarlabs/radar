import { z } from 'zod';

export const priceTokenIdSchema = z.object({
  tokenId: z.string({
    required_error: "Token ID is required",
    invalid_type_error: "Token ID must be a string"
  }).refine((tokenId) => ['btc', 'eth', 'scout-protocol-token'].includes(tokenId), {
    message: "Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token"
  })
});

export interface TokenPriceParams {
  tokenId: string;
}

export interface TokenPriceData {
  price: number;
  tokenId: string;
}

export type PriceTokenIdRequest = z.infer<typeof priceTokenIdSchema>;
