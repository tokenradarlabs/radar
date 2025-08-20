import { getDevPrice } from '../../../utils/uniswapPrice';
import { DevPriceData } from './devPrice.schema';

export class DevPriceService {
  static async getDevTokenPrice(): Promise<DevPriceData> {
    const priceData = await getDevPrice();

    if (!priceData || priceData === 0) {
      throw new Error("DEV token price data not found");
    }

    return {
      price: priceData,
      token: "scout-protocol-token",
      symbol: "DEV",
    };
  }
}
