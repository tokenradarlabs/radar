import 'dotenv/config';
import { validateEnvironmentVariables } from './envValidation';

// Interface for the Coingecko API response
interface CoinGeckoPriceChangeDetail {
  usd_24h_change: number;
}

interface CoinGeckoPriceChangeResponse {
  [tokenId: string]: CoinGeckoPriceChangeDetail;
}

/**
 * Fetches the price change data for a specific token from CoinGecko
 * @param tokenId The CoinGecko token ID (e.g., 'bitcoin')
 * @returns The 24h price change percentage in USD
 */
export async function fetchTokenPriceChange(
  tokenId: string
): Promise<number | null> {
  const { COINGECKO_API_KEY } = validateEnvironmentVariables();
  const url = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${tokenId}&include_24hr_change=true&precision=5`;

  const headers: Record<string, string> = {
    accept: 'application/json',
    'x-cg-demo-api-key': COINGECKO_API_KEY,
  };

  const options: RequestInit = {
    method: 'GET',
    headers,
  };

  try {
    console.log(`[CoinGecko] Fetching price 24h change for token: ${tokenId}`);
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[CoinGecko] Failed to fetch token price 24h change', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorBody,
      });
      return null;
    }

    const json = (await response.json()) as CoinGeckoPriceChangeResponse;
    const tokenData = json[tokenId];

    if (!tokenData || typeof tokenData.usd_24h_change !== 'number') {
      console.warn(
        '[CoinGecko] Received invalid or unexpected data structure',
        { response: json }
      );
      return null;
    }

    console.log(
      `[CoinGecko] Successfully fetched 24h price change for ${tokenId}: ${tokenData.usd_24h_change}%`
    );
    return tokenData.usd_24h_change;
  } catch (error) {
    console.error(
      '[CoinGecko] Error fetching or processing token 24h price change',
      {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      }
    );
    return null;
  }
}
