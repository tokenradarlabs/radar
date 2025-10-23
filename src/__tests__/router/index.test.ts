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

test('GET / returns index.html', async () => {
  const response = await fastify.inject({
    method: 'GET',
    url: '/',
  });
  expect(response.statusCode).toBe(200);
  expect(response.headers['content-type']).toContain('text/html');
  expect(response.payload).toContain('<!DOCTYPE html>');
});

test('GET // redirects to /', async () => {
  const response = await fastify.inject({
    method: 'GET',
    url: '//',
  });
  expect(response.statusCode).toBe(302);
  expect(response.headers.location).toBe('/');
});

test('GET empty path redirects to /', async () => {
  const response = await fastify.inject({
    method: 'GET',
    url: '',
  });
  expect(response.statusCode).toBe(302);
  expect(response.headers.location).toBe('/');
});
