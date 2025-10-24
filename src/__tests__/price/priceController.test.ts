import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
  beforeEach,
} from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import priceController from '../../controller/priceController';
import * as uniswapPriceUtils from '../../utils/uniswapPrice';
import { PriceService } from '../../lib/api/price';

// Mock the uniswap price utility
vi.mock('../../utils/uniswapPrice', () => ({
  getDevPrice: vi.fn(),
  getBtcPrice: vi.fn(),
  getEthPrice: vi.fn(),
}));

describe('Token Price Endpoint', () => {
  let app: FastifyInstance;
  const mockGetDevPrice = vi.mocked(uniswapPriceUtils.getDevPrice);
  const mockGetBtcPrice = vi.mocked(uniswapPriceUtils.getBtcPrice);
  const mockGetEthPrice = vi.mocked(uniswapPriceUtils.getEthPrice);
  const mockPriceServiceGetTokenPrice = vi.spyOn(PriceService, 'getTokenPrice');

  beforeAll(async () => {
    app = Fastify();
    await app.register(priceController, { prefix: '/api/v1/price' });
    await app.ready();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockPriceServiceGetTokenPrice.mockClear();

    // Suppress console.error during tests to avoid stderr output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(async () => {
    await app.close();
  });

  it('should successfully return BTC price data', async () => {
    const mockPrice = 45000.5;
    mockGetBtcPrice.mockResolvedValue(mockPrice);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/btc',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.price).toBe(mockPrice);
    expect(body.data.tokenId).toBe('btc');

    expect(mockGetBtcPrice).toHaveBeenCalledTimes(1);
  });

  it('should successfully return ETH price data', async () => {
    const mockPrice = 3200.75;
    mockGetEthPrice.mockResolvedValue(mockPrice);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/eth',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.price).toBe(mockPrice);
    expect(body.data.tokenId).toBe('eth');

    expect(mockGetEthPrice).toHaveBeenCalledTimes(1);
  });

  it('should successfully return DEV token price data', async () => {
    const mockPrice = 0.00015234;
    mockGetDevPrice.mockResolvedValue(mockPrice);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/scout-protocol-token',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.price).toBe(mockPrice);
    expect(body.data.tokenId).toBe('scout-protocol-token');

    expect(mockGetDevPrice).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid token IDs with validation error', async () => {
    const invalidTokenIdTestCases = [
      {
        tokenId: 'invalid-token',
        expectedError:
          'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token',
      },
      {
        tokenId: 'doge',
        expectedError:
          'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token',
      },
      {
        tokenId: 'unknown',
        expectedError:
          'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token',
      },
      {
        tokenId: '123',
        expectedError:
          'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token',
      },
      { tokenId: '', expectedError: 'Token ID cannot be empty' },
      { tokenId: ' ', expectedError: 'Token ID cannot be empty' }, // Empty string after trim
    ];

    for (const testCase of invalidTokenIdTestCases) {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/price/${testCase.tokenId}`,
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe(testCase.expectedError);
    }

    // Ensure no price fetching functions were called
    expect(mockGetBtcPrice).not.toHaveBeenCalled();
    expect(mockGetEthPrice).not.toHaveBeenCalled();
    expect(mockGetDevPrice).not.toHaveBeenCalled();
  });

  it('should handle zero price values as error', async () => {
    mockPriceServiceGetTokenPrice.mockRejectedValue(
      new Error('Failed to fetch token price from Uniswap')
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/btc',
    });

    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch token price');
  });

  it('should handle API errors gracefully', async () => {
    mockPriceServiceGetTokenPrice.mockRejectedValue(
      new Error('Network request failed')
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/btc',
    });

    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch token price');
  });

  it('should handle different price value ranges correctly', async () => {
    const testCases = [
      { tokenId: 'btc', price: 100000.99 },
      { tokenId: 'eth', price: 0.01 },
      {
        tokenId: 'scout-protocol-token',
        price: 0.000000001,
      },
    ];

    for (const testCase of testCases) {
      mockPriceServiceGetTokenPrice.mockResolvedValueOnce({
        price: testCase.price,
        tokenId: testCase.tokenId,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/price/${testCase.tokenId}`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.price).toBe(testCase.price);
      expect(body.data.tokenId).toBe(testCase.tokenId);

      // Verify correct function was called
      expect(mockPriceServiceGetTokenPrice).toHaveBeenCalledWith(
        testCase.tokenId
      );
    }
  });

  it('should not accept POST requests', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/price/btc',
    });

    expect(response.statusCode).toBe(404);
    expect(mockGetBtcPrice).not.toHaveBeenCalled();
  });

  it('should not accept PUT requests', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/price/eth',
    });

    expect(response.statusCode).toBe(404);
    expect(mockGetEthPrice).not.toHaveBeenCalled();
  });

  it('should not accept DELETE requests', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/price/scout-protocol-token',
    });

    expect(response.statusCode).toBe(404);
    expect(mockGetDevPrice).not.toHaveBeenCalled();
  });

  it('should return consistent data structure for all supported tokens', async () => {
    const tokens = [
      { id: 'btc', price: 45000 },
      { id: 'eth', price: 3200 },
      { id: 'scout-protocol-token', price: 0.001 },
    ];

    for (const token of tokens) {
      mockPriceServiceGetTokenPrice.mockResolvedValueOnce({
        price: token.price,
        tokenId: token.id,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/price/${token.id}`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);

      // Verify consistent structure
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
      expect(body.success).toBe(true);

      expect(body.data).toHaveProperty('price');
      expect(body.data).toHaveProperty('tokenId');

      // Verify values
      expect(body.data.price).toBe(token.price);
      expect(body.data.tokenId).toBe(token.id);

      // Verify data types
      expect(typeof body.data.price).toBe('number');
      expect(typeof body.data.tokenId).toBe('string');
    }
  });

  it('should return a successful response with correct data structure for a mocked price', async () => {
    const mockPrice = 123.45;
    const tokenId = 'eth';
    mockPriceServiceGetTokenPrice.mockResolvedValue({
      price: mockPrice,
      tokenId,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/price/${tokenId}`,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.price).toBe(mockPrice);
    expect(body.data.tokenId).toBe(tokenId);
  });

  it('should handle concurrent requests for different tokens', async () => {
    mockPriceServiceGetTokenPrice.mockResolvedValueOnce({
      price: 45000,
      tokenId: 'btc',
    });
    mockPriceServiceGetTokenPrice.mockResolvedValueOnce({
      price: 3200,
      tokenId: 'eth',
    });
    mockPriceServiceGetTokenPrice.mockResolvedValueOnce({
      price: 0.001,
      tokenId: 'scout-protocol-token',
    });

    // Make concurrent requests for all tokens
    const requests = [
      app.inject({ method: 'GET', url: '/api/v1/price/btc' }),
      app.inject({ method: 'GET', url: '/api/v1/price/eth' }),
      app.inject({ method: 'GET', url: '/api/v1/price/scout-protocol-token' }),
    ];

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach((response) => {
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    });

    // Verify each mock was called once
    expect(mockPriceServiceGetTokenPrice).toHaveBeenCalledWith('btc');
    expect(mockPriceServiceGetTokenPrice).toHaveBeenCalledWith('eth');
    expect(mockPriceServiceGetTokenPrice).toHaveBeenCalledWith(
      'scout-protocol-token'
    );
  });

  it('should handle non-Error exceptions gracefully', async () => {
    mockPriceServiceGetTokenPrice.mockRejectedValue('String error message');

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/btc',
    });

    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('An unexpected error occurred');
  });
});
