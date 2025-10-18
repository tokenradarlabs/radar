import { describe, it, expect } from 'vitest';
import { priceTokenIdSchema } from '../../utils/validation';

describe('priceTokenIdSchema', () => {
  it('should accept valid token IDs', () => {
    expect(priceTokenIdSchema.parse({ tokenId: 'btc' })).toEqual({ tokenId: 'btc' });
    expect(priceTokenIdSchema.parse({ tokenId: 'eth' })).toEqual({ tokenId: 'eth' });
    expect(priceTokenIdSchema.parse({ tokenId: 'scout-protocol-token' })).toEqual({ tokenId: 'scout-protocol-token' });
  });

  it('should reject invalid token IDs', () => {
    expect(() => priceTokenIdSchema.parse({ tokenId: 'invalid' })).toThrow();
    expect(() => priceTokenIdSchema.parse({ tokenId: '' })).toThrow();
    expect(() => priceTokenIdSchema.parse({ tokenId: ' ' })).toThrow(); // Empty string after trim
    expect(() => priceTokenIdSchema.parse({})).toThrow();
    expect(() => priceTokenIdSchema.parse({ tokenId: 123 })).toThrow();
  });

  it('should trim and lowercase token IDs before validation', () => {
    expect(priceTokenIdSchema.parse({ tokenId: '  BTC  ' })).toEqual({ tokenId: 'btc' });
    expect(priceTokenIdSchema.parse({ tokenId: '  ETH  ' })).toEqual({ tokenId: 'eth' });
    expect(priceTokenIdSchema.parse({ tokenId: '  Scout-Protocol-Token  ' })).toEqual({ tokenId: 'scout-protocol-token' });
  });
});