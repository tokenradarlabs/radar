import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PriceService } from '../../lib/api/price/price.service';
import * as uniswapPriceUtils from '../../utils/uniswapPrice';

// Mock the uniswap price utility
vi.mock('../../utils/uniswapPrice', () => ({
  getDevPrice: vi.fn(),
  getBtcPrice: vi.fn(),
  getEthPrice: vi.fn(),
}));

describe('PriceService', () => {
  const mockGetBtcPrice = vi.mocked(uniswapPriceUtils.getBtcPrice);
  const mockGetEthPrice = vi.mocked(uniswapPriceUtils.getEthPrice);
  const mockGetDevPrice = vi.mocked(uniswapPriceUtils.getDevPrice);

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock resolved values
    mockGetBtcPrice.mockResolvedValue(45000);
    mockGetEthPrice.mockResolvedValue(3200);
    mockGetDevPrice.mockResolvedValue(0.0001);
  });

  it("should return BTC price for 'btc'", async () => {
    const result = await PriceService.getTokenPrice('btc');
    expect(result.price).toBe(45000);
    expect(result.tokenId).toBe('btc');
    expect(mockGetBtcPrice).toHaveBeenCalledTimes(1);
  });

  it("should return BTC price for alias 'bitcoin'", async () => {
    const result = await PriceService.getTokenPrice('bitcoin');
    expect(result.price).toBe(45000);
    expect(result.tokenId).toBe('bitcoin');
    expect(mockGetBtcPrice).toHaveBeenCalledTimes(1);
  });

  it("should return BTC price for alias 'BITCOIN' (case-insensitive)", async () => {
    const result = await PriceService.getTokenPrice('BITCOIN');
    expect(result.price).toBe(45000);
    expect(result.tokenId).toBe('BITCOIN');
    expect(mockGetBtcPrice).toHaveBeenCalledTimes(1);
  });

  it("should return ETH price for 'eth'", async () => {
    const result = await PriceService.getTokenPrice('eth');
    expect(result.price).toBe(3200);
    expect(result.tokenId).toBe('eth');
    expect(mockGetEthPrice).toHaveBeenCalledTimes(1);
  });

  it("should return ETH price for alias 'ethereum'", async () => {
    const result = await PriceService.getTokenPrice('ethereum');
    expect(result.price).toBe(3200);
    expect(result.tokenId).toBe('ethereum');
    expect(mockGetEthPrice).toHaveBeenCalledTimes(1);
  });

  it("should return ETH price for alias 'ETHEREUM' (case-insensitive)", async () => {
    const result = await PriceService.getTokenPrice('ETHEREUM');
    expect(result.price).toBe(3200);
    expect(result.tokenId).toBe('ETHEREUM');
    expect(mockGetEthPrice).toHaveBeenCalledTimes(1);
  });

  it("should return DEV price for 'scout-protocol-token'", async () => {
    const result = await PriceService.getTokenPrice('scout-protocol-token');
    expect(result.price).toBe(0.0001);
    expect(result.tokenId).toBe('scout-protocol-token');
    expect(mockGetDevPrice).toHaveBeenCalledTimes(1);
  });

  it('should throw an error for an unknown token ID', async () => {
    await expect(PriceService.getTokenPrice('unknown-token')).rejects.toThrow(
      'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token'
    );
    expect(mockGetBtcPrice).not.toHaveBeenCalled();
    expect(mockGetEthPrice).not.toHaveBeenCalled();
    expect(mockGetDevPrice).not.toHaveBeenCalled();
  });

  it('should throw an error for an empty token ID', async () => {
    await expect(PriceService.getTokenPrice('')).rejects.toThrow(
      'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token'
    );
    expect(mockGetBtcPrice).not.toHaveBeenCalled();
    expect(mockGetEthPrice).not.toHaveBeenCalled();
    expect(mockGetDevPrice).not.toHaveBeenCalled();
  });

  it('should throw an error if price fetching returns 0', async () => {
    mockGetBtcPrice.mockResolvedValue(0);
    await expect(PriceService.getTokenPrice('btc')).rejects.toThrow(
      'Failed to fetch token price from Uniswap'
    );
  });
});
