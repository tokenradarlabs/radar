import { test, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../app';
import { FastifyInstance } from 'fastify';

let fastify: FastifyInstance;

beforeAll(async () => {
  fastify = await buildApp();
});

afterAll(async () => {
  await fastify.close();
});

test('GET / returns JSON response', async () => {
  const response = await fastify.inject({
    method: 'GET',
    url: '/',
  });
  expect(response.statusCode).toBe(200);
  expect(response.headers['content-type']).toContain('application/json');
  expect(response.json()).toEqual({ status: 'ok', message: 'Welcome to the API' });
});

test('GET // redirects to /', async () => {
  const response = await fastify.inject({
    method: 'GET',
    url: '//',
  });
  expect(response.statusCode).toBe(302);
  expect(response.headers.location).toBe('/');
});
