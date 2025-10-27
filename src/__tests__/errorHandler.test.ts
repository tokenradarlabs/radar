import { test, expect } from 'vitest';
import { buildApp } from '../app';
import { z } from 'zod';

test('should return 500 for an unexpected error', async () => {
  const app = await buildApp();
  await app.ready();

  const response = await app.inject({
    method: 'GET',
    url: '/test-500',
  });

  expect(response.statusCode).toBe(500);
  expect(response.json()).toEqual({
    success: false,
    error: 'An unexpected error occurred',
  });

  await app.close();
});

test('should return 400 for a ZodError', async () => {
  const app = await buildApp();
  await app.ready();

  const response = await app.inject({
    method: 'GET',
    url: '/test-400',
  });

  expect(response.statusCode).toBe(400);
  expect(response.json()).toEqual({
    success: false,
    error: 'Validation Error: name: Required',
  });

  await app.close();
});

test('should return 503 for a database unavailable error', async () => {
  const app = await buildApp();
  await app.ready();

  const response = await app.inject({
    method: 'GET',
    url: '/test-db-unavailable',
  });

  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual({
    success: false,
    error: 'Database unavailable',
  });

  await app.close();
});
