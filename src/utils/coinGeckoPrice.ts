import { fetchWithRetry } from './fetchWithRetry';
import { logger } from './logger';

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';

interface CoinGeckoPriceResponse {
  [key: string]: {
    usd: number;
  };
}

interface CoinGeckoHistoricalPriceResponse {
  prices: [number, number][]; // [timestamp, price]
}

export async function getCoinGeckoPrice(id: string): Promise<number | null> {
  try {
    const url = `${COINGECKO_API_BASE_URL}/simple/price?ids=${id}&vs_currencies=usd`;
    const data: CoinGeckoPriceResponse = await fetchWithRetry(url);
    return data[id]?.usd || null;
  } catch (error) {
    logger.error(`Error fetching price for ${id} from CoinGecko: ${error.message}`);
    return null;
  }
}

export async function getHistoricalPrice(
  id: string,
  vs_currency: string,
  days: number | 'max'
): Promise<CoinGeckoHistoricalPriceResponse | null> {
  try {
    const url = `${COINGECKO_API_BASE_URL}/coins/${id}/market_chart?vs_currency=${vs_currency}&days=${days}`;
    const data: CoinGeckoHistoricalPriceResponse = await fetchWithRetry(url);
    return data;
  } catch (error) {
    logger.error(`Error fetching historical price for ${id} from CoinGecko: ${error.message}`);
    return null;
  }
}
