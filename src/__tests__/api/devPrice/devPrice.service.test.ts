import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DevPriceService } from '../../../lib/api/devPrice/devPrice.service';
import * as coinGeckoPrice from '../../../utils/coinGeckoPrice';

vi.mock('../../../utils/coinGeckoPrice', () => ({
  fetchTokenPrice: vi.fn(),
}));

describe('DevPriceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return DEV token price on successful fetch', async () => {
    (coinGeckoPrice.fetchTokenPrice as vi.Mock).mockResolvedValue({ usd: 1.23 });

    const result = await DevPriceService.getDevTokenPrice();
    expect(result).toEqual({
      price: 1.23,
      token: 'scout-protocol-token',
      symbol: 'DEV',
    });
    expect(coinGeckoPrice.fetchTokenPrice).toHaveBeenCalledWith('scout-protocol-token');
  });

  it('should throw error if DEV token price data not found', async () => {
    (coinGeckoPrice.fetchTokenPrice as vi.Mock).mockResolvedValue(null);

    await expect(DevPriceService.getDevTokenPrice()).rejects.toThrow(
      'DEV token price data not found'
    );
  });

  it('should throw error if fetchTokenPrice throws', async () => {
    (coinGeckoPrice.fetchTokenPrice as vi.Mock).mockRejectedValue(new Error('API error'));

    await expect(DevPriceService.getDevTokenPrice()).rejects.toThrow(
      'DEV token price data not found'
    );
  });
});
