import { fetchTokenPriceChange } from '../../../utils/coinGeckoPriceChange';
import { TokenPriceChangeData } from './priceChange.schema';

export class PriceChangeService {
  static async getTokenPriceChange(
    tokenId: string
  ): Promise<TokenPriceChangeData> {
    try {
      const priceChangeData = await fetchTokenPriceChange(tokenId);

      if (priceChangeData === null) {
        throw new Error('Token price change data not found');
      }

      return {
        priceChange: priceChangeData,
        tokenId,
        period: '24h',
      };
    } catch (error) {
      console.error(`Error fetching price change for ${tokenId}:`, error);
      throw new Error('Failed to fetch token price change');
    }
  }
}
