import { z } from 'zod';
export { priceTokenIdSchema } from '../../../utils/validation';

export interface TokenPriceParams {
  tokenId: string;
}

export interface TokenPriceData {
  price: number;
  tokenId: string;
}

export type PriceTokenIdRequest = z.infer<typeof priceTokenIdSchema>;
