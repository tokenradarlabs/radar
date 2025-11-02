import { z } from 'zod';

import {
  priceChangeTokenIdSchema,
  PriceChangeTokenIdParams,
} from '../../utils/validation';

export { priceChangeTokenIdSchema };

export interface TokenPriceChangeParams extends PriceChangeTokenIdParams {}

export interface TokenPriceChangeData {
  priceChange: number;
  tokenId: string;
  period: string;
}

export type PriceChangeTokenIdRequest = z.infer<
  typeof priceChangeTokenIdSchema
>;
