import { validateEnvironmentVariables } from '../envValidation';
import { fetchWithRetry } from '../fetchWithRetry';
import { PriceProvider } from './index';

interface CoinGeckoPriceDetail {
  usd: number;
}

interface CoinGeckoPriceResponse {
  [tokenId: string]: CoinGeckoPriceDetail;
}

export class CoinGeckoAdapter implements PriceProvider {
  private readonly apiKey: string;

  constructor() {
    const { COINGECKO_API_KEY } = validateEnvironmentVariables();
    this.apiKey = COINGECKO_API_KEY;
  }

  async getCurrentPrice(tokenId: string): Promise<number> {
    const encodedTokenId = encodeURIComponent(tokenId);
    const url = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${encodedTokenId}&precision=5`;

    const headers: Record<string, string> = {
      accept: 'application/json',
      'x-cg-demo-api-key': this.apiKey,
    };

    const options: RequestInit = {
      method: 'GET',
      headers,
    };

    try {
      console.log(`[CoinGecko] Fetching price for token: ${tokenId}`);
      const response = await fetchWithRetry(url, options);

      const json = (await response.json()) as CoinGeckoPriceResponse;
      const tokenData = json[tokenId];

      if (!tokenData || typeof tokenData.usd !== 'number') {
        console.warn(
          '[CoinGecko] Received invalid or unexpected data structure',
          { response: json }
        );
        throw new Error('Invalid price data from CoinGecko');
      }

      console.log(
        `[CoinGecko] Successfully fetched price for ${tokenId}: $${tokenData.usd}`
      );
      return tokenData.usd;
    } catch (error) {
      console.error('[CoinGecko] Error fetching or processing token price', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
