import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { authenticateApiKey } from '../../utils/auth';
import { prisma } from '../../utils/prisma';
import bcrypt from 'bcrypt';

describe('authenticateApiKey middleware', () => {
  let testUser: any;
  let validApiKey: string;
  let expiredApiKey: string;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'auth-api-key-user@example.com',
        password: hashedPassword,
      },
    });

    // Create a valid API key
    const newValidApiKey = await prisma.apiKey.create({
      data: {
        key: `rdr_valid_${Math.random().toString(36).substring(7)}`,
        name: 'Valid Test Key',
        userId: testUser.id,
        isActive: true,
      },
    });
    validApiKey = newValidApiKey.key;

    // Create an expired API key (set expiresAt to a past date)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 1 day in the past

    const newExpiredApiKey = await prisma.apiKey.create({
      data: {
        key: `rdr_expired_${Math.random().toString(36).substring(7)}`,
        name: 'Expired Test Key',
        userId: testUser.id,
        isActive: true,
        expiresAt: pastDate,
      },
    });
    expiredApiKey = newExpiredApiKey.key;
  });

  afterAll(async () => {
    await prisma.apiKey.deleteMany({
      where: {
        userId: testUser.id,
      },
    });
    await prisma.user.delete({
      where: {
        id: testUser.id,
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset usage count for validApiKey before each test if needed
    await prisma.apiKey.update({
      where: { key: validApiKey },
      data: { usageCount: 0, lastUsedAt: new Date() },
    });
  });

  it('should authenticate a valid and non-expired API key', async () => {
    const request = {
      headers: { 'x-api-key': validApiKey },
      query: {},
    } as FastifyRequest;
    const reply = {
      code: () => reply, // Mock code method
      send: () => reply, // Mock send method
    } as FastifyReply;

    await authenticateApiKey(request, reply);

    expect(request.apiKey).toBeDefined();
    expect(request.apiKey?.key).toBe(validApiKey);
    expect(request.apiUser).toBeDefined();
    expect(request.apiUser?.id).toBe(testUser.id);

    const updatedApiKey = await prisma.apiKey.findUnique({
      where: { key: validApiKey },
    });
    expect(updatedApiKey?.usageCount).toBe(1);
  });

  it('should reject an expired API key', async () => {
    const request = {
      headers: { 'x-api-key': expiredApiKey },
      query: {},
    } as FastifyRequest;
    const reply = {
      code: (statusCode: number) => {
        expect(statusCode).toBe(401);
        return reply;
      },
      send: (payload: any) => {
        expect(payload.success).toBe(false);
        expect(payload.error).toBe('Expired API key');
        return reply;
      },
    } as FastifyReply;

    await authenticateApiKey(request, reply);

    expect(request.apiKey).toBeUndefined();
    expect(request.apiUser).toBeUndefined();
  });

  it('should reject an invalid API key', async () => {
    const request = {
      headers: { 'x-api-key': 'invalid_key' },
      query: {},
    } as FastifyRequest;
    const reply = {
      code: (statusCode: number) => {
        expect(statusCode).toBe(401);
        return reply;
      },
      send: (payload: any) => {
        expect(payload.success).toBe(false);
        expect(payload.error).toBe('Invalid or inactive API key');
        return reply;
      },
    } as FastifyReply;

    await authenticateApiKey(request, reply);

    expect(request.apiKey).toBeUndefined();
    expect(request.apiUser).toBeUndefined();
  });

  it('should reject if no API key is provided', async () => {
    const request = {
      headers: {},
      query: {},
    } as FastifyRequest;
    const reply = {
      code: (statusCode: number) => {
        expect(statusCode).toBe(401);
        return reply;
      },
      send: (payload: any) => {
        expect(payload.success).toBe(false);
        expect(payload.error).toContain('API key required');
        return reply;
      },
    } as FastifyReply;

    await authenticateApiKey(request, reply);

    expect(request.apiKey).toBeUndefined();
    expect(request.apiUser).toBeUndefined();
  });
});
