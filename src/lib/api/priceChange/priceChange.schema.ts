import { z } from 'zod';
import { REQUIRED_ERROR, INVALID_TYPE_ERROR } from '../../utils/validation';

export const priceChangeTokenIdSchema = z.object({
  tokenId: z.string({
    required_error: REQUIRED_ERROR,
    invalid_type_error: INVALID_TYPE_ERROR,
  }),
});

export interface TokenPriceChangeParams {
  tokenId: string;
}

export interface TokenPriceChangeData {
  priceChange: number;
  tokenId: string;
  period: string;
}

export type PriceChangeTokenIdRequest = z.infer<
  typeof priceChangeTokenIdSchema
>;
