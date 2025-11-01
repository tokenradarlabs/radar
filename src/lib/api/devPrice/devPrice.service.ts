import { fetchTokenPrice } from '../../../utils/coinGeckoPrice';
import { DevPriceData } from './devPrice.schema';

export class DevPriceService {
  static async getDevTokenPrice(): Promise<DevPriceData> {
    let priceData: { usd: number } | null;
    try {
      priceData = await fetchTokenPrice('scout-protocol-token');
    } catch (error) {
      console.error('Error fetching DEV token price from CoinGecko:', error);
      priceData = null;
    }

    if (!priceData || priceData.usd === 0) {
      throw new Error('DEV token price data not found');
    }

    return {
      price: priceData.usd,
      token: 'scout-protocol-token',
      symbol: 'DEV',
    };
  }
}
