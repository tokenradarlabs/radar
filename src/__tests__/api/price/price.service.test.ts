import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PriceService } from '../../../lib/api/price/price.service';
import * as coinGeckoPrice from '../../../utils/coinGeckoPrice';
import * as uniswapPrice from '../../../utils/uniswapPrice';

vi.mock('../../../utils/coinGeckoPrice', () => ({
  fetchTokenPrice: vi.fn(),
}));

vi.mock('../../../utils/uniswapPrice', () => ({
  getDevPrice: vi.fn(),
}));

describe('PriceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return BTC price from CoinGecko', async () => {
    (coinGeckoPrice.fetchTokenPrice as vi.Mock).mockResolvedValue({
      usd: 60000,
    });

    const result = await PriceService.getTokenPrice('btc');
    expect(result).toEqual({ price: 60000, tokenId: 'btc' });
    expect(coinGeckoPrice.fetchTokenPrice).toHaveBeenCalledWith('bitcoin');
  });

  it('should return ETH price from CoinGecko', async () => {
    (coinGeckoPrice.fetchTokenPrice as vi.Mock).mockResolvedValue({
      usd: 4000,
    });

    const result = await PriceService.getTokenPrice('eth');
    expect(result).toEqual({ price: 4000, tokenId: 'eth' });
    expect(coinGeckoPrice.fetchTokenPrice).toHaveBeenCalledWith('ethereum');
  });

  it('should return DEV price from Uniswap', async () => {
    (uniswapPrice.getDevPrice as vi.Mock).mockResolvedValue(1.5);

    const result = await PriceService.getTokenPrice('scout-protocol-token');
    expect(result).toEqual({ price: 1.5, tokenId: 'scout-protocol-token' });
    expect(uniswapPrice.getDevPrice).toHaveBeenCalled();
  });

  it('should throw error for unsupported token', async () => {
    await expect(PriceService.getTokenPrice('unsupported')).rejects.toThrow(
      'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token'
    );
  });

  it('should throw error if CoinGecko price fetch fails for BTC', async () => {
    (coinGeckoPrice.fetchTokenPrice as vi.Mock).mockResolvedValue(null);

    await expect(PriceService.getTokenPrice('btc')).rejects.toThrow(
      'Failed to fetch token price'
    );
  });

  it('should throw error if CoinGecko price fetch throws for ETH', async () => {
    (coinGeckoPrice.fetchTokenPrice as vi.Mock).mockRejectedValue(
      new Error('API error')
    );

    await expect(PriceService.getTokenPrice('eth')).rejects.toThrow(
      'Failed to fetch token price'
    );
  });

  it('should throw error if Uniswap DEV price fetch fails', async () => {
    (uniswapPrice.getDevPrice as vi.Mock).mockResolvedValue(0);

    await expect(
      PriceService.getTokenPrice('scout-protocol-token')
    ).rejects.toThrow('Failed to fetch token price');
  });
});
