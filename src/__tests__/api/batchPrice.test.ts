
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import router from '../../router';
import { prisma } from '../../utils/prisma';
import * as PriceService from '../../lib/api/price/price.service';
import { generateApiKey } from '../../lib/api/generateApi/generateApiKey.service';
import bcrypt from 'bcrypt';

// Mock the getPrice service
vi.mock('../../lib/api/price/price.service', () => ({
  getPrice: vi.fn(),
}));

describe('Batch Price Endpoint', () => {
  let app: FastifyInstance;
  let testUser: any;
  let apiKey: string;

  beforeAll(async () => {
    app = Fastify();
    await app.register(router);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Clean up test data
    await prisma.apiKey.deleteMany({
      where: {
        user: {
          email: {
            contains: 'batch-price-test',
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'batch-price-test',
        },
      },
    });

    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'batch-price-test-user@example.com',
        password: hashedPassword,
      },
    });

    const generatedKey = await generateApiKey({
      userId: testUser.id,
      name: 'Test Batch Price Key',
    });
    apiKey = generatedKey.apiKey;
  });

  it('should successfully fetch prices for multiple tokens', async () => {
    // Mock successful price fetches
    (PriceService.getPrice as vi.Mock).mockImplementation(async ({ tokenId }: { tokenId: string }) => {
      if (tokenId === 'bitcoin') {
        return { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 60000 };
      } else if (tokenId === 'ethereum') {
        return { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 4000 };
      }
      throw new Error('Token not found');
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/batch-price',
      headers: {
        'x-api-key': apiKey,
      },
      payload: {
        tokenIds: ['bitcoin', 'ethereum'],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Successfully fetched all prices.');
    expect(body.data).toBeDefined();
    expect(body.data.bitcoin.current_price).toBe(60000);
    expect(body.data.ethereum.current_price).toBe(4000);
    expect(body.errors).toBeUndefined();
  });

  it('should return 207 for partial failures', async () => {
    // Mock some successful, some failed price fetches
    (PriceService.getPrice as vi.Mock).mockImplementation(async ({ tokenId }: { tokenId: string }) => {
      if (tokenId === 'bitcoin') {
        return { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 60000 };
      } else if (tokenId === 'nonexistent-token') {
        throw new Error('Token not found');
      }
      throw new Error('Unexpected token');
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/batch-price',
      headers: {
        'x-api-key': apiKey,
      },
      payload: {
        tokenIds: ['bitcoin', 'nonexistent-token'],
      },
    });

    expect(response.statusCode).toBe(207);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Partial success: some prices could not be fetched.');
    expect(body.data).toBeDefined();
    expect(body.data.bitcoin.current_price).toBe(60000);
    expect(body.errors).toBeDefined();
    expect(body.errors['nonexistent-token']).toBe('Token not found');
  });

  it('should return 400 for an empty tokenIds array', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/batch-price',
      headers: {
        'x-api-key': apiKey,
      },
      payload: {
        tokenIds: [],
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Validation error');
    expect(body.errors[0].message).toBe('Array must contain at least 1 element(s)');
  });

  it('should return 400 for tokenIds array exceeding max limit (10)', async () => {
    const tokenIds = Array.from({ length: 11 }, (_, i) => `token${i}`);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/batch-price',
      headers: {
        'x-api-key': apiKey,
      },
      payload: {
        tokenIds,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Validation error');
    expect(body.errors[0].message).toBe('Maximum 10 token IDs allowed per request.');
  });

  it('should return 207 if all tokens fail to fetch', async () => {
    // Mock all price fetches to fail
    (PriceService.getPrice as vi.Mock).mockImplementation(async ({ tokenId }: { tokenId: string }) => {
      throw new Error(`Failed to fetch ${tokenId}`);
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/batch-price',
      headers: {
        'x-api-key': apiKey,
      },
      payload: {
        tokenIds: ['token1', 'token2'],
      },
    });

    expect(response.statusCode).toBe(207);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Partial success: some prices could not be fetched.');
    expect(Object.keys(body.data).length).toBe(0);
    expect(body.errors).toBeDefined();
    expect(body.errors.token1).toBe('Failed to fetch token1');
    expect(body.errors.token2).toBe('Failed to fetch token2');
  });

  it('should work correctly with a single token in the array', async () => {
    (PriceService.getPrice as vi.Mock).mockImplementation(async ({ tokenId }: { tokenId: string }) => {
      if (tokenId === 'solana') {
        return { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 150 };
      }
      throw new Error('Token not found');
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/batch-price',
      headers: {
        'x-api-key': apiKey,
      },
      payload: {
        tokenIds: ['solana'],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Successfully fetched all prices.');
    expect(body.data).toBeDefined();
    expect(body.data.solana.current_price).toBe(150);
    expect(body.errors).toBeUndefined();
  });
});
