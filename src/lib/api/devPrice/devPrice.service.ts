import { coinGeckoPriceProvider } from '../../../utils/coinGeckoPrice';
import { DevPriceData } from './devPrice.schema';

export class DevPriceService {
  static async getDevTokenPrice(): Promise<DevPriceData> {
    let price: number;
    try {
      price = await coinGeckoPriceProvider.getCurrentPrice(
        'scout-protocol-token'
      );
    } catch (error) {
      console.error('Error fetching DEV token price from CoinGecko:', error);
      throw new Error('Failed to fetch DEV token price');
    }

    if (price === 0) {
      throw new Error('DEV token price data not found');
    }

    return {
      price: price,
      token: 'scout-protocol-token',
      symbol: 'DEV',
    };
  }
}
