import { fetchTokenPrice } from '../utils/coinGeckoPrice';
import { getDevPrice } from '../utils/uniswapPrice';
import { PriceData, PriceFetchResult, RetryConfig } from '../types/price';

export class PriceAggregator {
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  };

  constructor(retryConfig?: Partial<RetryConfig>) {
    if (retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...retryConfig };
    }
  }

  /**
   * Fetch all cryptocurrency prices with retry logic
   */
  async fetchAllPrices(): Promise<PriceFetchResult> {
    try {
      const timestamp = new Date();
      
      // Fetch prices in parallel with individual retry logic
      const [btcData, ethData, devPrice] = await Promise.allSettled([
        this.retryOperation(() => fetchTokenPrice('bitcoin')),
        this.retryOperation(() => fetchTokenPrice('ethereum')),
        this.retryOperation(() => getDevPrice())
      ]);

      // Extract prices or set to 0 if failed
      const btcPrice = btcData.status === 'fulfilled' && btcData.value 
        ? btcData.value.usd 
        : 0;
      
      const ethPrice = ethData.status === 'fulfilled' && ethData.value 
        ? ethData.value.usd 
        : 0;
      
      const devPriceValue = devPrice.status === 'fulfilled' 
        ? devPrice.value 
        : 0;

      // Check if at least one price was fetched successfully
      if (btcPrice === 0 && ethPrice === 0 && devPriceValue === 0) {
        return {
          success: false,
          error: 'Failed to fetch any cryptocurrency prices'
        };
      }

      const priceData: PriceData = {
        timestamp,
        btcPrice,
        ethPrice,
        devPrice: devPriceValue,
        btcSource: 'coingecko',
        ethSource: 'coingecko',
        devSource: 'uniswap'
      };

      console.log(`[PriceAggregator] Successfully fetched prices:`, {
        btc: btcPrice,
        eth: ethPrice,
        dev: devPriceValue,
        timestamp: timestamp.toISOString()
      });

      return {
        success: true,
        data: priceData
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[PriceAggregator] Error fetching prices:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.retryConfig.maxRetries) {
        throw error;
      }

      const delay = this.retryConfig.delayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
      console.warn(`[PriceAggregator] Retry attempt ${attempt}/${this.retryConfig.maxRetries} after ${delay}ms`);
      
      await this.sleep(delay);
      return this.retryOperation(operation, attempt + 1);
    }
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
