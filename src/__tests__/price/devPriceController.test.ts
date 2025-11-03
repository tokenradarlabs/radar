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
import devPriceController from '../../controller/devPriceController';
import { DevPriceService } from '../../lib/api/devPrice/devPrice.service';
import { MockPriceProvider } from '../../utils/priceProvider/mockProvider';
import { PriceProvider } from '../../utils/priceProvider';

// Mock the coinGeckoPriceProvider module
const mockPriceProvider = new MockPriceProvider();
vi.mock('../../../utils/coinGeckoPrice', () => ({
  coinGeckoPriceProvider: mockPriceProvider,
}));

describe('DEV Price Endpoint', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    await app.register(devPriceController, { prefix: '/api/v1/price/dev' });
    await app.ready();
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Suppress console.error during tests to avoid stderr output
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a fresh Fastify instance for each test
    app = Fastify();

    // Register the dev price controller
    await app.register(devPriceController, { prefix: '/api/v1/price/dev' });

    // Set a default mock price for DEV token
    mockPriceProvider.setPrice('scout-protocol-token', 0.00015234);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should successfully return DEV token price data', async () => {
    // Mock successful price fetch
    const mockPrice = 0.00015234;
    mockPriceProvider.setPrice('scout-protocol-token', mockPrice);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/dev',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.price).toBe(mockPrice);
    expect(body.data.token).toBe('scout-protocol-token');
    expect(body.data.symbol).toBe('DEV');
  });

  it('should handle different price values correctly', async () => {
    const testCases = [
      {
        name: 'small price value',
        mockPrice: 0.000001,
        expectedPrice: 0.000001,
      },
      {
        name: 'larger price value',
        mockPrice: 1.25,
        expectedPrice: 1.25,
      },
      {
        name: 'integer price value',
        mockPrice: 5,
        expectedPrice: 5,
      },
      {
        name: 'high precision decimal',
        mockPrice: 0.123456789,
        expectedPrice: 0.123456789,
      },
    ];

    for (const testCase of testCases) {
      mockPriceProvider.setPrice('scout-protocol-token', testCase.mockPrice);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/price/dev',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.price).toBe(testCase.expectedPrice);
      expect(body.data.token).toBe('scout-protocol-token');
      expect(body.data.symbol).toBe('DEV');
    }
  });

  it('should handle zero price value as error', async () => {
    // Mock zero price (should trigger error)
    mockPriceProvider.setPrice('scout-protocol-token', 0);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/dev',
    });

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('DEV token price data not found');
  });

  it('should handle null price value as error', async () => {
    // Mock null price (should trigger error by returning 0 from mock provider)
    mockPriceProvider.setPrice('scout-protocol-token', undefined as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/dev',
    });

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('DEV token price data not found');
  });

  it('should handle undefined price value as error', async () => {
    // Mock undefined price (should trigger error by returning 0 from mock provider)
    mockPriceProvider.setPrice('scout-protocol-token', undefined as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/dev',
    });

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('DEV token price data not found');
  });

  it('should handle network/API errors gracefully', async () => {
    const errorTestCases = [
      {
        name: 'network error',
        error: new Error('Network request failed'),
        expectedMessage: 'Failed to fetch DEV token price',
      },
      {
        name: 'timeout error',
        error: new Error('Request timeout'),
        expectedMessage: 'Failed to fetch DEV token price',
      },
      {
        name: 'RPC error',
        error: new Error('RPC endpoint error'),
        expectedMessage: 'Failed to fetch DEV token price',
      },
      {
        name: 'generic error',
        error: new Error('Something went wrong'),
        expectedMessage: 'Failed to fetch DEV token price',
      },
    ];

    for (const testCase of errorTestCases) {
      vi.spyOn(mockPriceProvider, 'getCurrentPrice').mockRejectedValueOnce(
        testCase.error
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/price/dev',
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe(testCase.expectedMessage);
    }
  });

  it('should handle non-Error exceptions gracefully', async () => {
    // Mock non-Error exception (e.g., string thrown)
    vi.spyOn(mockPriceProvider, 'getCurrentPrice').mockRejectedValueOnce(
      'String error message'
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/dev',
    });

    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch DEV token price');
  });

  it('should not accept POST requests', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/price/dev',
    });

    expect(response.statusCode).toBe(404);
  });

  it('should not accept PUT requests', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/price/dev',
    });

    expect(response.statusCode).toBe(404);
  });

  it('should not accept DELETE requests', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/price/dev',
    });

    expect(response.statusCode).toBe(404);
  });

  it('should return consistent data structure across multiple requests', async () => {
    const prices = [0.0001, 0.0005, 0.001, 0.01, 0.1];

    for (const price of prices) {
      mockPriceProvider.setPrice('scout-protocol-token', price);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/price/dev',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);

      // Verify consistent structure
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
      expect(body.success).toBe(true);

      expect(body.data).toHaveProperty('price');
      expect(body.data).toHaveProperty('token');
      expect(body.data).toHaveProperty('symbol');

      // Verify consistent values
      expect(body.data.price).toBe(price);
      expect(body.data.token).toBe('scout-protocol-token');
      expect(body.data.symbol).toBe('DEV');

      // Verify data types
      expect(typeof body.data.price).toBe('number');
      expect(typeof body.data.token).toBe('string');
      expect(typeof body.data.symbol).toBe('string');
    }
  });

  it('should handle very small price values correctly', async () => {
    // Test very small decimal values that might cause precision issues
    const verySmallPrice = 0.000000001; // 1e-9
    mockPriceProvider.setPrice('scout-protocol-token', verySmallPrice);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/price/dev',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.price).toBe(verySmallPrice);

    // Ensure the price is still a valid number
    expect(typeof body.data.price).toBe('number');
    expect(body.data.price).toBeGreaterThan(0);
  });

  it('should handle concurrent requests correctly', async () => {
    const mockPrice = 0.00023456;
    mockPriceProvider.setPrice('scout-protocol-token', mockPrice);

    // Make multiple concurrent requests
    const requests = Array(5)
      .fill(null)
      .map(() =>
        app.inject({
          method: 'GET',
          url: '/api/v1/price/dev',
        })
      );

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach((response) => {
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.price).toBe(mockPrice);
      expect(body.data.token).toBe('scout-protocol-token');
      expect(body.data.symbol).toBe('DEV');
    });
  });
});
