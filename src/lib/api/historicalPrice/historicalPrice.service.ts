
import { HistoricalPriceSchema } from './historicalPrice.schema';
import { getHistoricalPrice } from '../../../utils/coinGeckoPrice';
import { getCache, setCache } from '../../../utils/cache';
import { logger } from '../../../utils/logger';

const CACHE_PREFIX = 'historical_price';
const CACHE_TTL = 5 * 60; // 5 minutes

export async function getHistoricalPriceService(params: HistoricalPriceSchema) {
  const cacheKey = `${CACHE_PREFIX}:${params.id}:${params.vs_currency}:${params.days}`;
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    logger.info(`Cache hit for historical price: ${cacheKey}`);
    return cachedData;
  }

  logger.info(`Cache miss for historical price: ${cacheKey}. Fetching from CoinGecko.`);
  const data = await getHistoricalPrice(params.id, params.vs_currency, params.days);

  if (data) {
    await setCache(cacheKey, data, CACHE_TTL);
  }

  return data;
}
