import { test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../app';
import { FastifyInstance } from 'fastify';


let fastify: FastifyInstance;

beforeAll(async () => {
  // Set environment variables for testing rate limiter
  process.env.RATE_LIMIT_MAX_REQUESTS = '2';
  process.env.RATE_LIMIT_TIME_WINDOW = '1 second';
  process.env.RATE_LIMIT_EXCLUDE_ROUTES = '/health';

  fastify = await buildApp();
});

afterAll(async () => {
  await fastify.close();
  // Clean up environment variables after tests
  delete process.env.RATE_LIMIT_MAX_REQUESTS;
  delete process.env.RATE_LIMIT_TIME_WINDOW;
  delete process.env.RATE_LIMIT_EXCLUDE_ROUTES;
});

// Helper to wait for a given time
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('GET /health should not be rate-limited', async () => {
  const responses = [];
  for (let i = 0; i < 5; i++) {
    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    });
    responses.push(response);
  }

  for (const response of responses) {
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  }
});

test('Public routes should be rate-limited by IP', async () => {
  // First two requests should pass
  const response1 = await fastify.inject({
    method: 'GET',
    url: '/',
  });
  expect(response1.statusCode).toBe(200);

  const response2 = await fastify.inject({
    method: 'GET',
    url: '/',
  });
  expect(response2.statusCode).toBe(200);

  // Third request should be rate-limited
  const response3 = await fastify.inject({
    method: 'GET',
    url: '/',
  });
  expect(response3.statusCode).toBe(429);
  expect(response3.json()).toEqual({
    success: false,
    error: 'Rate limit exceeded, retry in 1.',
  });

  // Wait for the time window to reset
  await wait(1100); // 1 second + a little buffer

  // After reset, request should pass again
  const response4 = await fastify.inject({
    method: 'GET',
    url: '/',
  });
  expect(response4.statusCode).toBe(200);
});

test('Public routes should be rate-limited by API key', async () => {
  const apiKey = 'test-api-key-123';

  // First two requests with API key should pass
  const response1 = await fastify.inject({
    method: 'GET',
    url: '/',
    headers: { 'x-api-key': apiKey },
  });
  expect(response1.statusCode).toBe(200);

  const response2 = await fastify.inject({
    method: 'GET',
    url: '/',
    headers: { 'x-api-key': apiKey },
  });
  expect(response2.statusCode).toBe(200);

  // Third request with same API key should be rate-limited
  const response3 = await fastify.inject({
    method: 'GET',
    url: '/',
    headers: { 'x-api-key': apiKey },
  });
  expect(response3.statusCode).toBe(429);
  expect(response3.json()).toEqual({
    success: false,
    error: 'Rate limit exceeded, retry in 1.',
  });

  // Request with a different API key should pass immediately
  const anotherApiKey = 'test-api-key-456';
  const response4 = await fastify.inject({
    method: 'GET',
    url: '/',
    headers: { 'x-api-key': anotherApiKey },
  });
  expect(response4.statusCode).toBe(200);

  // Wait for the time window to reset for the first API key
  await wait(1100);

  // After reset, request with first API key should pass again
  const response5 = await fastify.inject({
    method: 'GET',
    url: '/',
    headers: { 'x-api-key': apiKey },
  });
  expect(response5.statusCode).toBe(200);
});
