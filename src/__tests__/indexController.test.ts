import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as healthCheck from '../utils/healthCheck';

describe('Index Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return a JSON contract for the root route', async () => {
    const response = await request(app.server).get('/');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body).toEqual({
      status: 'ok',
      message: 'Welcome to the API',
    });
  });

  describe('/health endpoint', () => {
    it('should return basic health status and version', async () => {
      const response = await request(app.server).get('/health');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        status: 'up',
        version: '4.1.0',
      });
    });
  });

  describe('/health/detailed endpoint', () => {
    // Mock health check functions
    const mockHealthCheckResult = (status: 'up' | 'down' | 'degraded', message?: string) => ({
      status,
      timestamp: new Date().toISOString(),
      responseTime: 100,
      message,
    });

    beforeAll(() => {
      vi.spyOn(healthCheck, 'checkDatabaseHealth').mockResolvedValue(mockHealthCheckResult('up'));
      vi.spyOn(healthCheck, 'checkCoinGeckoHealth').mockResolvedValue(mockHealthCheckResult('up'));
      vi.spyOn(healthCheck, 'checkAnkrRpcHealth').mockResolvedValue(mockHealthCheckResult('up'));
      vi.spyOn(healthCheck, 'checkMemoryUsage').mockResolvedValue({
        status: 'up',
        timestamp: new Date().toISOString(),
        details: { rss: '100.00 MB', heapUsed: '50.00 MB', heapTotal: '70.00 MB' },
      });
    });

    it('should return detailed health status when all services are up', async () => {
      const response = await request(app.server).get('/health/detailed');

      expect(response.statusCode).toBe(200);
      expect(response.body.overallStatus).toBe('up');
      expect(response.body.version).toBe('4.1.0');
      expect(response.body.checks.database.status).toBe('up');
      expect(response.body.checks.coinGecko.status).toBe('up');
      expect(response.body.checks.ankrRpc.status).toBe('up');
      expect(response.body.checks.memoryUsage.status).toBe('up');
    });

    it('should return overall status down if database is down', async () => {
      vi.spyOn(healthCheck, 'checkDatabaseHealth').mockResolvedValueOnce(mockHealthCheckResult('down', 'DB connection failed'));

      const response = await request(app.server).get('/health/detailed');

      expect(response.statusCode).toBe(503);
      expect(response.body.overallStatus).toBe('down');
      expect(response.body.checks.database.status).toBe('down');
      expect(response.body.checks.database.message).toBe('DB connection failed');
    });

    it('should return overall status degraded if CoinGecko is degraded', async () => {
      vi.spyOn(healthCheck, 'checkCoinGeckoHealth').mockResolvedValueOnce(mockHealthCheckResult('degraded', 'CoinGecko rate limit'));

      const response = await request(app.server).get('/health/detailed');

      expect(response.statusCode).toBe(206);
      expect(response.body.overallStatus).toBe('degraded');
      expect(response.body.checks.coinGecko.status).toBe('degraded');
      expect(response.body.checks.coinGecko.message).toBe('CoinGecko rate limit');
    });

    it('should return overall status down if Ankr RPC is down', async () => {
      vi.spyOn(healthCheck, 'checkAnkrRpcHealth').mockResolvedValueOnce(mockHealthCheckResult('down', 'Ankr RPC unreachable'));

      const response = await request(app.server).get('/health/detailed');

      expect(response.statusCode).toBe(503);
      expect(response.body.overallStatus).toBe('down');
      expect(response.body.checks.ankrRpc.status).toBe('down');
      expect(response.body.checks.ankrRpc.message).toBe('Ankr RPC unreachable');
    });
  });
});
