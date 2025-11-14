import { fetchTokenPriceChange } from '../../../utils/coinGeckoPriceChange';
import { TokenPriceChangeData } from './priceChange.schema';
import { telemetry } from '../../../utils/telemetry';

export class PriceChangeService {
  static async getTokenPriceChange(
    tokenId: string
  ): Promise<TokenPriceChangeData> {
    const startTime = process.hrtime.bigint();
    try {
      const priceChangeData = await fetchTokenPriceChange(tokenId);

      if (priceChangeData === null) {
        throw new Error('Token price change data not found');
      }

      telemetry.recordCount('price_change_service_call', 1, { tokenId });
      return {
        priceChange: priceChangeData,
        tokenId,
        period: '24h',
      };
    } catch (error) {
      console.error(`Error fetching price change for ${tokenId}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch token price change: ${error}`);
    } finally {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      telemetry.recordDuration('price_change_service_duration', durationMs, {
        tokenId,
      });
    }
  }
}
