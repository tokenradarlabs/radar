import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTokenPrice } from '../../utils/coinGeckoPrice';
import { fetchWithRetry } from '../../utils/fetchWithRetry';
import * as envValidation from '../../utils/envValidation';

// Mock fetchWithRetry
vi.mock('../../utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(),
}));

// Mock envValidation
vi.mock('../../utils/envValidation', () => ({
  validateEnvironmentVariables: vi.fn(() => ({
    COINGECKO_API_KEY: 'test-api-key',
  })),
}));

describe('fetchTokenPrice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return token price on successful fetch', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ bitcoin: { usd: 50000 } }),
    };
    (fetchWithRetry as vi.Mock).mockResolvedValue(mockResponse as Response);

    const result = await fetchTokenPrice('bitcoin');
    expect(result).toEqual({ usd: 50000 });
    expect(fetchWithRetry).toHaveBeenCalledWith(
      expect.stringContaining('https://api.coingecko.com/api/v3/simple/price'),
      expect.any(Object)
    );
  });

  it('should return null if fetchWithRetry throws an error', async () => {
    (fetchWithRetry as vi.Mock).mockRejectedValue(new Error('Network error'));

    const result = await fetchTokenPrice('bitcoin');
    expect(result).toBeNull();
  });

  it('should return null if API response is invalid', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ bitcoin: { usd_24h_change: 1.23 } }), // Missing usd
    };
    (fetchWithRetry as vi.Mock).mockResolvedValue(mockResponse as Response);

    const result = await fetchTokenPrice('bitcoin');
    expect(result).toBeNull();
  });

  it('should return null if token data is not found in response', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ ethereum: { usd: 3000 } }),
    };
    (fetchWithRetry as vi.Mock).mockResolvedValue(mockResponse as Response);

    const result = await fetchTokenPrice('bitcoin'); // Requesting bitcoin, but response has ethereum
    expect(result).toBeNull();
  });
});
