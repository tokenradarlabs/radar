export interface PriceData {
  timestamp: Date;
  btcPrice: number;
  ethPrice: number;
  devPrice: number;
  btcSource: string;
  ethSource: string;
  devSource: string;
}

export interface PriceFetchResult {
  success: boolean;
  data?: PriceData;
  error?: string;
}

export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}
