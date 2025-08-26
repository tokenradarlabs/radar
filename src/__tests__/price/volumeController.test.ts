import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import volumeController from "../../controller/volumeController";
import * as coinGeckoVolumeUtils from "../../utils/coinGeckoVolume";

// Mock the CoinGecko volume utility
vi.mock("../../utils/coinGeckoVolume", () => ({
  fetchTokenVolume: vi.fn()
}));

describe("Token Volume Endpoint", () => {
  let app: FastifyInstance;
  const mockFetchTokenVolume = vi.mocked(coinGeckoVolumeUtils.fetchTokenVolume);

  beforeAll(async () => {
    app = Fastify();
    await app.register(volumeController, { prefix: '/api/v1/volume' });
    await app.ready();
  });

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Suppress console.error during tests to avoid stderr output
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a fresh Fastify instance for each test
    app = Fastify();
    
    // Register the volume controller
    await app.register(volumeController, { prefix: '/api/v1/volume' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should successfully return token volume data', async () => {
    const mockVolumeData = {
      usd_24h_vol: 1234567890.50
    };
    const tokenId = 'bitcoin';
    mockFetchTokenVolume.mockResolvedValue(mockVolumeData);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/volume/${tokenId}`
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.volume).toBe(mockVolumeData.usd_24h_vol);
    expect(body.data.tokenId).toBe(tokenId);
    expect(body.data.period).toBe('24h');

    expect(mockFetchTokenVolume).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenVolume).toHaveBeenCalledWith(tokenId);
  });

  it('should handle different volume values correctly', async () => {
    const testCases = [
      {
        tokenId: 'bitcoin',
        volumeData: { usd_24h_vol: 25000000000 }, // $25B
        expectedVolume: 25000000000
      },
      {
        tokenId: 'ethereum',
        volumeData: { usd_24h_vol: 15000000000 }, // $15B
        expectedVolume: 15000000000
      },
      {
        tokenId: 'scout-protocol-token',
        volumeData: { usd_24h_vol: 1000000.50 }, // $1M
        expectedVolume: 1000000.50
      },
      {
        tokenId: 'small-cap-token',
        volumeData: { usd_24h_vol: 10000 }, // $10K
        expectedVolume: 10000
      }
    ];

    for (const testCase of testCases) {
      mockFetchTokenVolume.mockResolvedValue(testCase.volumeData);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/volume/${testCase.tokenId}`
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.volume).toBe(testCase.expectedVolume);
      expect(body.data.tokenId).toBe(testCase.tokenId);
      expect(body.data.period).toBe('24h');
    }
  });

  it('should handle zero volume correctly', async () => {
    const mockVolumeData = {
      usd_24h_vol: 0
    };
    const tokenId = 'zero-volume-token';
    mockFetchTokenVolume.mockResolvedValue(mockVolumeData);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/volume/${tokenId}`
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.volume).toBe(0);
    expect(body.data.tokenId).toBe(tokenId);
    expect(body.data.period).toBe('24h');
  });

  it('should handle very small volume values correctly', async () => {
    const mockVolumeData = {
      usd_24h_vol: 0.01
    };
    const tokenId = 'micro-cap-token';
    mockFetchTokenVolume.mockResolvedValue(mockVolumeData);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/volume/${tokenId}`
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.volume).toBe(0.01);
    expect(body.data.tokenId).toBe(tokenId);
    expect(body.data.period).toBe('24h');
    expect(typeof body.data.volume).toBe('number');
  });

  it('should handle very large volume values correctly', async () => {
    const mockVolumeData = {
      usd_24h_vol: 999999999999.99 // Nearly $1T
    };
    const tokenId = 'mega-cap-token';
    mockFetchTokenVolume.mockResolvedValue(mockVolumeData);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/volume/${tokenId}`
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.volume).toBe(999999999999.99);
    expect(body.data.tokenId).toBe(tokenId);
    expect(body.data.period).toBe('24h');
  });

  it('should handle null/undefined volume data as error', async () => {
    const tokenId = 'invalid-token';

    mockFetchTokenVolume.mockResolvedValueOnce(null);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/volume/${tokenId}`,
    });

    expect(response.statusCode).toBe(400);
    
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Token volume data not found');

    expect(mockFetchTokenVolume).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenVolume).toHaveBeenCalledWith(tokenId);
  });

  it('should handle empty string token ID', async () => {
    const tokenId = '';
    const mockVolumeData = { usd_24h_vol: 0 }; // Assume empty string gets treated as valid

    mockFetchTokenVolume.mockResolvedValueOnce(mockVolumeData);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/volume/${tokenId}`,
    });

    // This returns 200 based on actual controller behavior
    expect(response.statusCode).toBe(200);
    expect(mockFetchTokenVolume).toHaveBeenCalled();
  });

  it('should handle network/API errors gracefully', async () => {
    const errorTestCases = [
      {
        name: 'network error',
        error: new Error('Network request failed'),
        expectedMessage: 'Network request failed'
      },
      {
        name: 'API rate limit error',
        error: new Error('API rate limit exceeded'),
        expectedMessage: 'API rate limit exceeded'
      },
      {
        name: 'timeout error',
        error: new Error('Request timeout'),
        expectedMessage: 'Request timeout'
      },
      {
        name: 'server error',
        error: new Error('CoinGecko API server error'),
        expectedMessage: 'CoinGecko API server error'
      }
    ];

    const tokenId = 'bitcoin';

    for (const testCase of errorTestCases) {
      mockFetchTokenVolume.mockRejectedValue(testCase.error);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/volume/${tokenId}`
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe(testCase.expectedMessage);
    }
  });

  it('should handle non-Error exceptions gracefully', async () => {
    const tokenId = 'bitcoin';
    mockFetchTokenVolume.mockRejectedValue('String error message');

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/volume/${tokenId}`
    });

    expect(response.statusCode).toBe(400);
    
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch token volume');
  });

  it('should not accept POST requests', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/volume/bitcoin'
    });

    expect(response.statusCode).toBe(404);
    expect(mockFetchTokenVolume).not.toHaveBeenCalled();
  });

  it('should not accept PUT requests', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/volume/ethereum'
    });

    expect(response.statusCode).toBe(404);
    expect(mockFetchTokenVolume).not.toHaveBeenCalled();
  });

  it('should not accept DELETE requests', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/volume/bitcoin'
    });

    expect(response.statusCode).toBe(404);
    expect(mockFetchTokenVolume).not.toHaveBeenCalled();
  });

  it('should return consistent data structure across different tokens', async () => {
    const tokens = [
      { id: 'bitcoin', volume: 25000000000 },
      { id: 'ethereum', volume: 15000000000 },
      { id: 'scout-protocol-token', volume: 1000000 }
    ];

    for (const token of tokens) {
      const mockVolumeData = { usd_24h_vol: token.volume };
      mockFetchTokenVolume.mockResolvedValue(mockVolumeData);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/volume/${token.id}`
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      
      // Verify consistent structure
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
      expect(body.success).toBe(true);
      
      expect(body.data).toHaveProperty('volume');
      expect(body.data).toHaveProperty('tokenId');
      expect(body.data).toHaveProperty('period');
      
      // Verify values
      expect(body.data.volume).toBe(token.volume);
      expect(body.data.tokenId).toBe(token.id);
      expect(body.data.period).toBe('24h');
      
      // Verify data types
      expect(typeof body.data.volume).toBe('number');
      expect(typeof body.data.tokenId).toBe('string');
      expect(typeof body.data.period).toBe('string');
    }
  });

  it('should handle concurrent requests for different tokens', async () => {
    const concurrentTokens = [
      { id: 'bitcoin', volume: 25000000000 },
      { id: 'ethereum', volume: 15000000000 },
      { id: 'cardano', volume: 500000000 }
    ];

    // Setup mocks to return different values based on call count
    let callCount = 0;
    mockFetchTokenVolume.mockImplementation(() => {
      const result = { usd_24h_vol: concurrentTokens[callCount % concurrentTokens.length].volume };
      callCount++;
      return Promise.resolve(result);
    });

    // Make concurrent requests
    const requests = concurrentTokens.map(token => 
      app.inject({
        method: 'GET',
        url: `/api/v1/volume/${token.id}`
      })
    );

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach((response) => {
      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(typeof body.data.volume).toBe('number');
      expect(body.data.volume).toBeGreaterThanOrEqual(0);
    });

    expect(mockFetchTokenVolume).toHaveBeenCalledTimes(3);
  });

  it('should handle special characters in token ID', async () => {
    const tokensWithSpecialChars = [
      'token-with-dashes',
      'token_with_underscores',
      'token123',
      'token.with.dots'
    ];

    for (const tokenId of tokensWithSpecialChars) {
      const mockVolumeData = { usd_24h_vol: 1000000 };
      mockFetchTokenVolume.mockResolvedValue(mockVolumeData);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/volume/${tokenId}`
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.tokenId).toBe(tokenId);
      expect(body.data.volume).toBe(1000000);
    }
  });

  it('should handle decimal volume values correctly', async () => {
    const decimalTestCases = [
      { volume: 123456789.123456, description: 'high precision decimal' },
      { volume: 0.000001, description: 'very small decimal' },
      { volume: 999.99, description: 'standard decimal' },
      { volume: 1000000.50, description: 'million with cents' }
    ];

    const tokenId = 'decimal-volume-token';

    for (const testCase of decimalTestCases) {
      const mockVolumeData = { usd_24h_vol: testCase.volume };
      mockFetchTokenVolume.mockResolvedValue(mockVolumeData);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/volume/${tokenId}`
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.volume).toBe(testCase.volume);
      expect(typeof body.data.volume).toBe('number');
    }
  });

  it('should handle volume data with additional fields correctly', async () => {
    const mockVolumeData = {
      usd_24h_vol: 5000000,
      other_field: 'should be ignored',
      another_field: 12345,
      nested: {
        field: 'also ignored'
      }
    };
    const tokenId = 'token-with-extra-data';
    mockFetchTokenVolume.mockResolvedValue(mockVolumeData);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/volume/${tokenId}`
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.volume).toBe(5000000);
    expect(body.data.tokenId).toBe(tokenId);
    expect(body.data.period).toBe('24h');
    
    // Should not include extra fields from the API response
    expect(body.data).not.toHaveProperty('other_field');
    expect(body.data).not.toHaveProperty('another_field');
    expect(body.data).not.toHaveProperty('nested');
  });
});
