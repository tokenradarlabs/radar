import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import priceAlertController from '../../controller/alerts/priceAlertController';
import { prisma } from '../../utils/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

describe('Price Alert Controller', () => {
  let app: FastifyInstance;
  let testuser: any;
  let apiKey: any;

  beforeAll(async () => {
    app = Fastify();
    await app.register(priceAlertController);
    const hashedPassword = await bcrypt.hash('AlertPassword123@', 12);
    // Create a test user and API key in the DB
    testuser = await prisma.user.create({
      data: { email: 'alertuser@example.com', password: hashedPassword },
    });
    apiKey = await prisma.apiKey.create({
      data: { key: 'alert-api-key', name: 'alert', userId: testuser.id },
    });
  });

  afterAll(async () => {
    await prisma.priceAlert.deleteMany({});
    await prisma.alert.deleteMany({
      where: {
        user: {
          email: {
            contains: 'alert',
          },
        },
      },
    });
    await prisma.apiKey.deleteMany({
      where: {
        user: {
          email: {
            contains: 'alert',
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'alert',
        },
      },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it('should create a price alert for an authenticated user with valid API key', async () => {
    const token = jwt.sign(
      { id: testuser.id, email: testuser.email },
      JWT_SECRET
    );
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/price-alert',
      headers: {
        authorization: `Bearer ${token}`,
        'x-api-key': apiKey.key,
        'content-type': 'application/json',
      },
      payload: {
        tokenId: 'dev',
        value: 123.45,
        direction: 'up',
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.success).toBe(true);
    expect(body.data.alert).toHaveProperty('userId', testuser.id);
    expect(body.data.alert).toHaveProperty('tokenId', 'dev');
    expect(body.data.alert).toHaveProperty('direction', 'up');
    expect(body.data.alert).toHaveProperty('value', 123.45);
    expect(body.data.alert.alertId).toBeDefined();
    expect(body.data.alert.priceAlertId).toBeDefined();
  });

  it('should fail if JWT is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/price-alert',
      headers: {
        'x-api-key': apiKey.key,
        'content-type': 'application/json',
      },
      payload: {
        tokenId: 'dev',
        value: 123.45,
        direction: 'up',
      },
    });
    expect(response.statusCode).toBe(401);
  });

  it('should fail if API key is missing', async () => {
    const token = jwt.sign(
      { id: testuser.id, email: testuser.email },
      JWT_SECRET
    );
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/price-alert',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      payload: {
        tokenId: 'dev',
        value: 123.45,
        direction: 'up',
      },
    });
    expect(response.statusCode).toBe(401);
  });

  it('should fail with invalid tokenId', async () => {
    const token = jwt.sign(
      { id: testuser.id, email: testuser.email },
      JWT_SECRET
    );
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/price-alert',
      headers: {
        authorization: `Bearer ${token}`,
        'x-api-key': apiKey.key,
        'content-type': 'application/json',
      },
      payload: {
        tokenId: 'invalid',
        value: 123.45,
        direction: 'up',
      },
    });
    expect(response.statusCode).toBe(400);
  });
});
