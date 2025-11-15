import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { prisma } from '../../utils/prisma';
import getApiKeysController from '../../controller/api/getApiKeysController';
import { sign } from 'jsonwebtoken';
import { JWT_SECRET } from '../../utils/envValidation';

// Mock the authentication plugin
vi.mock('../../plugins/authenticate', () => ({
  authenticate: vi.fn(async (request, reply) => {
    if (!request.headers.authorization) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }
    try {
      const token = request.headers.authorization.split(' ')[1];
      const decoded: any = sign(token, JWT_SECRET); // In a real scenario, you'd verify, not sign again
      request.user = { id: decoded.userId };
    } catch (err) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
    }
  }),
}));

describe('API Key Usage Analytics Endpoint', () => {
  let app: FastifyInstance;
  let testUser: any;
  let testApiKey: any;
  let testApiKey2: any;

  beforeAll(async () => {
    app = Fastify();
    // Mock the authenticate plugin
    await app.register(require('../../plugins/authenticate'));
    await app.register(getApiKeysController, { prefix: '/api/keys' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.usageLog.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.user.deleteMany();

    testUser = await prisma.user.create({
      data: {
        email: 'analytics-user@example.com',
        password: 'hashedpassword',
      },
    });

    testApiKey = await prisma.apiKey.create({
      data: {
        key: 'rdr_testapikey1',
        name: 'Test Key 1',
        userId: testUser.id,
      },
    });

    testApiKey2 = await prisma.apiKey.create({
      data: {
        key: 'rdr_testapikey2',
        name: 'Test Key 2',
        userId: testUser.id,
      },
    });

    // Populate usage logs
    const now = new Date();
    await prisma.usageLog.createMany({
      data: [
        { apiKeyId: testApiKey.id, endpoint: '/price', response_time_ms: 100, status_code: 200, createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) }, // 5 days ago
        { apiKeyId: testApiKey.id, endpoint: '/price', response_time_ms: 120, status_code: 200, createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) }, // 4 days ago
        { apiKeyId: testApiKey.id, endpoint: '/price', response_time_ms: 150, status_code: 500, createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }, // 3 days ago (error)
        { apiKeyId: testApiKey2.id, endpoint: '/volume', response_time_ms: 200, status_code: 200, createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }, // 2 days ago
        { apiKeyId: testApiKey2.id, endpoint: '/volume', response_time_ms: 220, status_code: 200, createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) }, // 1 day ago
      ],
    });
  });

  it('should successfully fetch overall usage analytics for a user', async () => {
    const token = sign({ userId: testUser.id }, JWT_SECRET);
    const response = await app.inject({
      method: 'POST',
      url: '/api/keys/usageAnalytics',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {},
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.totalRequests).toBe(5);
    expect(body.data.averageResponseTime).toBeCloseTo(158);
    expect(body.data.errorRate).toBeCloseTo(20);
    expect(body.data.popularEndpoints).toEqual([
      { endpoint: '/price', count: 3 },
      { endpoint: '/volume', count: 2 },
    ]);
    expect(body.data.timeSeries).toBeUndefined();
  });

  it('should successfully fetch usage analytics filtered by apiKeyId', async () => {
    const token = sign({ userId: testUser.id }, JWT_SECRET);
    const response = await app.inject({
      method: 'POST',
      url: '/api/keys/usageAnalytics',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        apiKeyId: testApiKey.id,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.totalRequests).toBe(3);
    expect(body.data.averageResponseTime).toBeCloseTo(123.33);
    expect(body.data.errorRate).toBeCloseTo(33.33);
    expect(body.data.popularEndpoints).toEqual([
      { endpoint: '/price', count: 3 },
    ]);
    expect(body.data.timeSeries).toBeUndefined();
  });

  it('should successfully fetch daily usage analytics with date range', async () => {
    const token = sign({ userId: testUser.id }, JWT_SECRET);
    const now = new Date();
    const endDate = now.toISOString();
    const startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(); // 6 days ago

    const response = await app.inject({
      method: 'POST',
      url: '/api/keys/usageAnalytics',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        startDate,
        endDate,
        interval: 'daily',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.totalRequests).toBe(5);
    expect(body.data.timeSeries).toBeDefined();
    expect(body.data.timeSeries.length).toBeGreaterThan(0);

    // Example of expected timeSeries structure (adjust based on actual data and date logic)
    const expectedDates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      expectedDates.push(d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }));
    }

    // Check if timeSeries contains expected dates and data
    // This part might need more precise assertions based on the exact date formatting and data aggregation
    expect(body.data.timeSeries[0].date).toBe(expectedDates[0]);
    expect(body.data.timeSeries[0].requests).toBe(1); // 5 days ago
    expect(body.data.timeSeries[2].errors).toBe(1); // 3 days ago
  });

  it('should handle unauthorized access', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/keys/usageAnalytics',
      headers: {
        authorization: `Bearer invalid_token`,
      },
      payload: {},
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('should handle invalid date format in request', async () => {
    const token = sign({ userId: testUser.id }, JWT_SECRET);
    const response = await app.inject({
      method: 'POST',
      url: '/api/keys/usageAnalytics',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        startDate: 'invalid-date',
        endDate: new Date().toISOString(),
        interval: 'daily',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid datetime');
  });
});
