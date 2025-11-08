import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PriceChangeService } from '../../../lib/api/priceChange/priceChange.service';
import * as coinGeckoPriceChange from '../../../utils/coinGeckoPriceChange';
import { telemetry } from '../../../utils/telemetry';

vi.mock('../../../utils/coinGeckoPriceChange', () => ({
  fetchTokenPriceChange: vi.fn(),
}));

vi.mock('../../../utils/telemetry', () => ({
  telemetry: {
    recordDuration: vi.fn(),
    recordCount: vi.fn(),
  },
}));

const mockRecordDuration = vi.mocked(telemetry.recordDuration);
const mockRecordCount = vi.mocked(telemetry.recordCount);

describe('PriceChangeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENABLE_TELEMETRY = 'true';
  });

  it('should return token price change on successful fetch and record telemetry', async () => {
    (coinGeckoPriceChange.fetchTokenPriceChange as vi.Mock).mockResolvedValue(
      1.23
    );

    const result = await PriceChangeService.getTokenPriceChange('bitcoin');
    expect(result).toEqual({
      priceChange: 1.23,
      tokenId: 'bitcoin',
      period: '24h',
    });
    expect(coinGeckoPriceChange.fetchTokenPriceChange).toHaveBeenCalledWith(
      'bitcoin'
    );

    // Assert telemetry calls
    expect(mockRecordCount).toHaveBeenCalledTimes(1);
    expect(mockRecordCount).toHaveBeenCalledWith('price_change_service_call', 1, { tokenId: 'bitcoin' });
    expect(mockRecordDuration).toHaveBeenCalledTimes(1);
    expect(mockRecordDuration).toHaveBeenCalledWith(
      'price_change_service_duration',
      expect.any(Number),
      { tokenId: 'bitcoin' }
    );
  });

  it('should throw error if price change data is not found', async () => {
    (coinGeckoPriceChange.fetchTokenPriceChange as vi.Mock).mockResolvedValue(
      null
    );

    await expect(
      PriceChangeService.getTokenPriceChange('bitcoin')
    ).rejects.toThrow('Token price change data not found');

    // Telemetry should still be recorded even on error
    expect(mockRecordCount).toHaveBeenCalledTimes(1);
    expect(mockRecordDuration).toHaveBeenCalledTimes(1);
  });

  it('should throw error if fetchTokenPriceChange throws', async () => {
    (coinGeckoPriceChange.fetchTokenPriceChange as vi.Mock).mockRejectedValue(
      new Error('API error')
    );

    await expect(
      PriceChangeService.getTokenPriceChange('bitcoin')
    ).rejects.toThrow('Failed to fetch token price change');

    // Telemetry should still be recorded even on error
    expect(mockRecordCount).toHaveBeenCalledTimes(1);
    expect(mockRecordDuration).toHaveBeenCalledTimes(1);
  });
});
