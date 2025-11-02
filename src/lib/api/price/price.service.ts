import { fetchTokenPrice } from '../../../utils/coinGeckoPrice';
import { getDevPrice } from '../../../utils/uniswapPrice';
import { TokenPriceData } from './price.schema';

export class PriceService {
  static async getTokenPrice(tokenId: string): Promise<TokenPriceData> {
    let price: number | null;

    const normalizedTokenId = tokenId.toLowerCase();

    try {
      switch (normalizedTokenId) {
        case 'btc':
        case 'bitcoin': {
          const btcPriceData = await fetchTokenPrice('bitcoin');
          price = btcPriceData ? btcPriceData.usd : null;
          break;
        }
        case 'eth':
        case 'ethereum': {
          const ethPriceData = await fetchTokenPrice('ethereum');
          price = ethPriceData ? ethPriceData.usd : null;
          break;
        }
        case 'scout-protocol-token':
          // Assuming 'scout-protocol-token' is a custom token not on CoinGecko, or its CoinGecko ID is different.
          // If it should be fetched from CoinGecko, replace getDevPrice with fetchTokenPrice('scout-protocol-token').
          price = await getDevPrice();
          break;
        default:
          throw new Error(
            'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token'
          );
      }
    } catch (error) {
      console.error(`Error fetching price for ${tokenId}:`, error);
      price = null;
    }

    if (price === null || price === 0) {
      throw new Error('Failed to fetch token price');
    }

    return {
      price,
      tokenId,
    };
  }
}
