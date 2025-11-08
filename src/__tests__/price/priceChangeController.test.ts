import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import priceChangeController from '../../controller/priceChangeController';

// Mock the CoinGecko price change utility
vi.mock('../../utils/coinGeckoPriceChange', () => ({
  fetchTokenPriceChange: vi.fn(),
}));

// Mock the telemetry utility
vi.mock('../../utils/telemetry', () => ({
  telemetry: {
    recordDuration: vi.fn(),
    recordCount: vi.fn(),
  },
}));

// Import the mocked functions
import { fetchTokenPriceChange } from '../../utils/coinGeckoPriceChange';
import { telemetry } from '../../utils/telemetry';

const mockFetchTokenPriceChange = vi.mocked(fetchTokenPriceChange);
const mockRecordDuration = vi.mocked(telemetry.recordDuration);
const mockRecordCount = vi.mocked(telemetry.recordCount);

describe('Token Price Change Endpoint', () => {
  let app: any;

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Enable telemetry for tests
    process.env.ENABLE_TELEMETRY = 'true';

    // Suppress console.error during tests to avoid stderr output
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a fresh Fastify instance for each test
    app = Fastify();

    // Register the price change controller
    await app.register(priceChangeController, {
      prefix: '/api/v1/priceChange',
    });
  });

  it('should successfully return positive price change data and record telemetry', async () => {
    const tokenId = 'bitcoin';
    const mockPriceChange = 2.5; // 2.5% change

    mockFetchTokenPriceChange.mockResolvedValueOnce(mockPriceChange);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      priceChange: mockPriceChange,
      tokenId: tokenId,
      period: '24h',
    });

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenPriceChange).toHaveBeenCalledWith(tokenId);

    // Assert telemetry calls
    expect(mockRecordCount).toHaveBeenCalledTimes(1);
    expect(mockRecordCount).toHaveBeenCalledWith('price_change_request', 1, { tokenId });
    expect(mockRecordDuration).toHaveBeenCalledTimes(1);
    expect(mockRecordDuration).toHaveBeenCalledWith(
      'price_change_controller_duration',
      expect.any(Number),
      { method: 'GET', url: `/api/v1/priceChange/${tokenId}` }
    );
  });

  it('should successfully return negative price change data', async () => {
    const tokenId = 'ethereum';
    const mockPriceChange = -1.2; // -1.2% change

    mockFetchTokenPriceChange.mockResolvedValueOnce(mockPriceChange);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      priceChange: mockPriceChange,
      tokenId: tokenId,
      period: '24h',
    });

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenPriceChange).toHaveBeenCalledWith(tokenId);
  });

  it('should handle zero price change correctly', async () => {
    const tokenId = 'tether';
    const mockPriceChange = 0; // 0% change

    mockFetchTokenPriceChange.mockResolvedValueOnce(mockPriceChange);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      priceChange: mockPriceChange,
      tokenId: tokenId,
      period: '24h',
    });

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenPriceChange).toHaveBeenCalledWith(tokenId);
  });

  it('should handle different token IDs correctly', async () => {
    const tokenId = 'chainlink';
    const mockPriceChange = 1.8; // 1.8% change

    mockFetchTokenPriceChange.mockResolvedValueOnce(mockPriceChange);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      priceChange: mockPriceChange,
      tokenId: tokenId,
      period: '24h',
    });

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenPriceChange).toHaveBeenCalledWith(tokenId);
  });

  it('should handle null price change data as error', async () => {
    const tokenId = 'invalid-token';

    mockFetchTokenPriceChange.mockResolvedValueOnce(null);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Token price change data not found');

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenPriceChange).toHaveBeenCalledWith(tokenId);
  });

  it('should handle empty string token ID', async () => {
    const tokenId = '';
    const mockPriceChange = 0; // Assume empty string gets treated as valid and returns some default

    mockFetchTokenPriceChange.mockResolvedValueOnce(mockPriceChange);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    // This returns 200 based on actual controller behavior
    expect(response.statusCode).toBe(200);
    expect(mockFetchTokenPriceChange).toHaveBeenCalled();
  });

  it('should handle network/API errors gracefully', async () => {
    const tokenId = 'bitcoin';

    // Test network error
    mockFetchTokenPriceChange.mockRejectedValueOnce(
      new Error('Network request failed')
    );

    let response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(400);
    let body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Network request failed'); // Actual error message

    // Test API rate limit error
    mockFetchTokenPriceChange.mockRejectedValueOnce(
      new Error('API rate limit exceeded')
    );

    response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(400);
    body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('API rate limit exceeded'); // Actual error message

    // Test timeout error
    mockFetchTokenPriceChange.mockRejectedValueOnce(
      new Error('Request timeout')
    );

    response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(400);
    body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Request timeout'); // Actual error message

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(3);
  });

  it('should handle non-Error exceptions gracefully', async () => {
    const tokenId = 'bitcoin';

    mockFetchTokenPriceChange.mockRejectedValueOnce('String error message');

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch token price change'); // Non-Error exception message

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenPriceChange).toHaveBeenCalledWith(tokenId);
  });

  it('should handle extreme price change values', async () => {
    const tokenId = 'volatile-coin';
    const mockPriceChange = 999.99; // 999.99% change

    mockFetchTokenPriceChange.mockResolvedValueOnce(mockPriceChange);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      priceChange: mockPriceChange,
      tokenId: tokenId,
      period: '24h',
    });

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenPriceChange).toHaveBeenCalledWith(tokenId);
  });

  it('should not accept POST requests', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/priceChange/bitcoin',
    });

    expect(response.statusCode).toBe(404);
    expect(mockFetchTokenPriceChange).not.toHaveBeenCalled();
  });

  it('should not accept PUT requests', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/priceChange/bitcoin',
    });

    expect(response.statusCode).toBe(404);
    expect(mockFetchTokenPriceChange).not.toHaveBeenCalled();
  });

  it('should not accept DELETE requests', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/priceChange/bitcoin',
    });

    expect(response.statusCode).toBe(404);
    expect(mockFetchTokenPriceChange).not.toHaveBeenCalled();
  });

  it('should return consistent data structure across different tokens', async () => {
    const tokens = ['bitcoin', 'ethereum', 'cardano'];
    const mockChanges = [2.5, -1.3, 0.8];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const change = mockChanges[i];

      mockFetchTokenPriceChange.mockResolvedValueOnce(change);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/priceChange/${token}`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('priceChange', change);
      expect(body.data).toHaveProperty('tokenId', token);
      expect(body.data).toHaveProperty('period', '24h');
    }

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(3);
  });

  it('should handle concurrent requests for different tokens', async () => {
    const tokenData = [
      { token: 'bitcoin', change: 1.5 },
      { token: 'ethereum', change: -0.8 },
    ];

    // Setup mocks for concurrent calls
    tokenData.forEach(({ change }) => {
      mockFetchTokenPriceChange.mockResolvedValueOnce(change);
    });

    const requests = tokenData.map(({ token }) =>
      app.inject({
        method: 'GET',
        url: `/api/v1/priceChange/${token}`,
      })
    );

    const responses = await Promise.all(requests);

    responses.forEach((response, index) => {
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual({
        priceChange: tokenData[index].change,
        tokenId: tokenData[index].token,
        period: '24h',
      });
    });

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(2);
  });

  it('should handle special characters in token ID', async () => {
    const tokenId = 'token-with-dashes_and_underscores';
    const mockPriceChange = 2.3;

    mockFetchTokenPriceChange.mockResolvedValueOnce(mockPriceChange);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      priceChange: mockPriceChange,
      tokenId: tokenId,
      period: '24h',
    });

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenPriceChange).toHaveBeenCalledWith(tokenId);
  });

  it('should handle very large negative price changes', async () => {
    const tokenId = 'crashed-coin';
    const mockPriceChange = -99.99; // -99.99% change

    mockFetchTokenPriceChange.mockResolvedValueOnce(mockPriceChange);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      priceChange: mockPriceChange,
      tokenId: tokenId,
      period: '24h',
    });

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenPriceChange).toHaveBeenCalledWith(tokenId);
  });

  it('should handle decimal price changes correctly', async () => {
    const tokenId = 'stable-coin';
    const mockPriceChange = 0.01; // 0.01% change

    mockFetchTokenPriceChange.mockResolvedValueOnce(mockPriceChange);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/priceChange/${tokenId}`,
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      priceChange: mockPriceChange,
      tokenId: tokenId,
      period: '24h',
    });

    expect(mockFetchTokenPriceChange).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenPriceChange).toHaveBeenCalledWith(tokenId);
  });
});
