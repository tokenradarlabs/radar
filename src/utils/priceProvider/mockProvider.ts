import { PriceProvider } from './index';

export class MockPriceProvider implements PriceProvider {
  private prices: { [tokenId: string]: number };

  constructor(initialPrices: { [tokenId: string]: number } = {}) {
    this.prices = initialPrices;
  }

  setPrice(tokenId: string, price: number): void {
    this.prices[tokenId] = price;
  }

  async getCurrentPrice(tokenId: string): Promise<number> {
    if (this.prices[tokenId] !== undefined) {
      console.log(`[MockPriceProvider] Providing mock price for ${tokenId}: $${this.prices[tokenId]}`);
      return this.prices[tokenId];
    }
    console.warn(`[MockPriceProvider] No mock price set for ${tokenId}. Returning 0.`);
    return 0;
  }
}
