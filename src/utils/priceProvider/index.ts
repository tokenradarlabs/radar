export interface PriceProvider {
  getCurrentPrice(tokenId: string): Promise<number>;
}
