import {
  getDevPrice,
  getBtcPrice,
  getEthPrice,
} from '../../../utils/uniswapPrice';
import { TokenPriceData } from './price.schema';

export class PriceService {
  static async getTokenPrice(tokenId: string): Promise<TokenPriceData> {
    let price: number;

    const normalizedTokenId = tokenId.toLowerCase();

    switch (normalizedTokenId) {
      case 'btc':
      case 'bitcoin':
        price = await getBtcPrice();
        break;
      case 'eth':
      case 'ethereum':
        price = await getEthPrice();
        break;
      case 'scout-protocol-token':
        price = await getDevPrice();
        break;
      default:
        throw new Error(
          'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token'
        );
    }

    if (price === 0) {
      throw new Error('Failed to fetch token price from Uniswap');
    }

    return {
      price,
      tokenId,
    };
  }
}
