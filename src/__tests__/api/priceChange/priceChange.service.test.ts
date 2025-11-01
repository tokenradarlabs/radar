import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PriceChangeService } from '../../../lib/api/priceChange/priceChange.service';
import * as coinGeckoPriceChange from '../../../utils/coinGeckoPriceChange';

vi.mock('../../../utils/coinGeckoPriceChange', () => ({
  fetchTokenPriceChange: vi.fn(),
}));

describe('PriceChangeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return token price change on successful fetch', async () => {
    (coinGeckoPriceChange.fetchTokenPriceChange as vi.Mock).mockResolvedValue(1.23);

    const result = await PriceChangeService.getTokenPriceChange('bitcoin');
    expect(result).toEqual({ priceChange: 1.23, tokenId: 'bitcoin', period: '24h' });
    expect(coinGeckoPriceChange.fetchTokenPriceChange).toHaveBeenCalledWith('bitcoin');
  });

  it('should throw error if price change data is not found', async () => {
    (coinGeckoPriceChange.fetchTokenPriceChange as vi.Mock).mockResolvedValue(null);

    await expect(PriceChangeService.getTokenPriceChange('bitcoin')).rejects.toThrow(
      'Token price change data not found'
    );
  });

  it('should throw error if fetchTokenPriceChange throws', async () => {
    (coinGeckoPriceChange.fetchTokenPriceChange as vi.Mock).mockRejectedValue(new Error('API error'));

    await expect(PriceChangeService.getTokenPriceChange('bitcoin')).rejects.toThrow(
      'Failed to fetch token price change'
    );
  });
});
