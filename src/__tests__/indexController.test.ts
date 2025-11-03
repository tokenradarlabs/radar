import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

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
});
