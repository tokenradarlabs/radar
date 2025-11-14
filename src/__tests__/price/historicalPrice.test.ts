
import { FastifyInstance } from 'fastify';
import { build } from '../../app'; // Adjust path as necessary
import { prisma } from '../../utils/prisma';
import * as CoinGeckoPrice from '../../utils/coinGeckoPrice';
import * as Cache from '../../utils/cache';
import { vi } from 'vitest';

describe('Historical Price API', () => {
  let fastify: FastifyInstance;
  let apiKey: string;

  beforeAll(async () => {
    fastify = await build();
    await fastify.ready();

    // Create a test API key
    const user = await prisma.user.create({
      data: { email: 'test-historical@example.com', password: 'password123' },
    });
    const apiKeyValue = 'test_historical_api_key';
    await prisma.apiKey.create({
      data: { userId: user.id, value: apiKeyValue, scopes: ['read:price'] },
    });
    apiKey = apiKeyValue;

    // Mock CoinGeckoPrice and Cache
    vi.spyOn(CoinGeckoPrice, 'getHistoricalPrice').mockResolvedValue({
      prices: [
        [1678886400000, 20000], // March 15, 2023 00:00:00 UTC
        [1678972800000, 21000], // March 16, 2023 00:00:00 UTC
      ],
    });
    vi.spyOn(Cache, 'getCache').mockResolvedValue(null);
    vi.spyOn(Cache, 'setCache').mockResolvedValue(undefined);
  });

  afterEach(() => vi.clearAllMocks());

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { value: 'test_historical_api_key' } });
    await prisma.user.deleteMany({ where: { email: 'test-historical@example.com' } });
    await prisma.$disconnect();
    await fastify.close();
  });

  it('should return historical price data for a valid token ID and days', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/historical-price?id=bitcoin&days=7',
      headers: { 'x-api-key': apiKey },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('success', true);
    expect(response.json().data).toHaveProperty('prices');
    expect(response.json().data.prices.length).toBeGreaterThan(0);
  });

  it('should return 400 if token ID is missing', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/historical-price?days=7',
      headers: { 'x-api-key': apiKey },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty('success', false);
    expect(response.json().error).toContain('Token ID is required');
  });

  it('should return 400 if days is invalid', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/historical-price?id=bitcoin&days=invalid',
      headers: { 'x-api-key': apiKey },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty('success', false);
    expect(response.json().error).toContain('Invalid enum value');
  });

  it('should use cached data if available', async () => {
    const mockCacheData = {
      prices: [
        [1678886400000, 20000], // March 15, 2023 00:00:00 UTC
        [1678972800000, 21000], // March 16, 2023 00:00:00 UTC
      ],
    };
    vi.spyOn(Cache, 'getCache').mockResolvedValueOnce(mockCacheData);

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/historical-price?id=ethereum&days=1',
      headers: { 'x-api-key': apiKey },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual(mockCacheData);
    expect(CoinGeckoPrice.getHistoricalPrice).not.toHaveBeenCalled();
  });

  it('should fetch from CoinGecko and cache if not available', async () => {
    vi.spyOn(Cache, 'getCache').mockResolvedValueOnce(null);
    const mockCoinGeckoData = {
      prices: [
        [1678886400000, 1500], // March 15, 2023 00:00:00 UTC
        [1678972800000, 1600], // March 16, 2023 00:00:00 UTC
      ],
    };
    vi.spyOn(CoinGeckoPrice, 'getHistoricalPrice').mockResolvedValueOnce(mockCoinGeGeckoData);

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/historical-price?id=litecoin&days=1',
      headers: { 'x-api-key': apiKey },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual(mockCoinGeckoData);
    expect(Cache.setCache).toHaveBeenCalledWith(
      'historical_price:litecoin:usd:1',
      mockCoinGeckoData,
      300
    );
  });

  it('should return 404 if historical price data is not found from CoinGecko', async () => {
    vi.spyOn(CoinGeckoPrice, 'getHistoricalPrice').mockResolvedValueOnce(null);

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/historical-price?id=nonexistent&days=1',
      headers: { 'x-api-key': apiKey },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toHaveProperty('success', true);
    expect(response.json().message).toContain('Historical price data not found');
  });
});
