import { test, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app';
import { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

test('should return 500 for an unexpected error', async () => {
  app.get('/test-500', async () => {
    throw new Error('Unexpected error');
  });

  const response = await app.inject({
    method: 'GET',
    url: '/test-500',
  });

  expect(response.statusCode).toBe(500);
  expect(response.json()).toEqual({
    success: false,
    error: 'An unexpected error occurred',
  });
});

test('should return 400 for a ZodError', async () => {
  app.get('/test-400', async () => {
    const schema = z.object({ name: z.string().min(1) });
    schema.parse({}); // This will throw a ZodError
  });

  const response = await app.inject({
    method: 'GET',
    url: '/test-400',
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({
    success: false,
    error: 'Validation Error: name: Required',
  });
});

test('should return 503 for a database unavailable error', async () => {
  app.get('/test-db-unavailable', async () => {
    const error = new Error('Database connection failed');
    (error as any).code = 'P1001'; // Prisma error code for can't reach database server
    throw error;
  });

  const response = await app.inject({
    method: 'GET',
    url: '/test-db-unavailable',
  });

  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual({
    success: false,
    error: 'Database unavailable',
  });
});

import { test, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
