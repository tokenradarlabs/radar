import { test, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../../app';
import { FastifyInstance } from 'fastify';
import logger from '../../utils/logger';

let testServer: FastifyInstance;
const originalMaxDurations = process.env.REQUEST_TIMING_MAX_DURATIONS;
const originalEnableLogs = process.env.ENABLE_REQUEST_TIMING_LOGS;

beforeAll(async () => {
  process.env.ENABLE_REQUEST_TIMING_LOGS = 'true';
  process.env.REQUEST_TIMING_MAX_DURATIONS = '5'; // Use a small number for testing
  testServer = await buildApp();
  await testServer.ready();
});

afterAll(async () => {
  await testServer.close();
  process.env.REQUEST_TIMING_MAX_DURATIONS = originalMaxDurations;
  process.env.ENABLE_REQUEST_TIMING_LOGS = originalEnableLogs;
});

test('requestTiming plugin should log response time percentiles', async () => {
  const loggerSpy = vi.spyOn(logger, 'info');

  try {
    // Make 5 requests to trigger percentile calculation
    for (let i = 0; i < 5; i++) {
      await testServer.inject({
        method: 'GET',
        url: '/health',
      });
    }

    // Verify that percentile logs are present
    const percentileLogCall = loggerSpy.mock.calls.find(
      (call) =>
        typeof call[0] === 'string' && call[0].includes('Response Time Percentiles')
    );

    expect(percentileLogCall).toBeDefined();
    expect(percentileLogCall![0]).toMatch(
      /Response Time Percentiles \(last 5 requests\): P50=\d+\.\d{2}ms, P95=\d+\.\d{2}ms, P99=\d+\.\d{2}ms/
    );
  } finally {
    loggerSpy.mockRestore();
  }
});
