import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../../utils/prisma';
import apiKeyController from '../../controller/api/apiKeyController';

describe('API Key Generate Endpoint', () => {
  let app: FastifyInstance;
  let testUser: any;

  beforeAll(async () => {
    app = Fastify();
    await app.register(apiKeyController, { prefix: '/api/keys' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data in correct order due to foreign key constraints
    await prisma.apiKey.deleteMany({
      where: {
        user: {
          email: {
            contains: 'generate-key',
          },
        },
      },
    });

    await prisma.alert.deleteMany({
      where: {
        user: {
          email: {
            contains: 'generate-key',
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'generate-key',
        },
      },
    });

    // Add a small delay to ensure database operations are complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'generate-key-user@example.com',
        password: hashedPassword,
      },
    });
  });

  it('should successfully generate API key with valid credentials', async () => {
    const requestData = {
      email: testUser.email,
      password: 'TestPassword123!',
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: requestData,
    });

    expect(response.statusCode).toBe(201);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.apiKey).toBeDefined();
    expect(typeof body.data.apiKey).toBe('string');
    expect(body.data.apiKey).toMatch(/^rdr_[a-f0-9]{128}$/);

    // Verify the API key was actually created in the database
    const createdApiKey = await prisma.apiKey.findUnique({
      where: { key: body.data.apiKey },
    });
    expect(createdApiKey).toBeTruthy();
    expect(createdApiKey?.userId).toBe(testUser.id);
    expect(createdApiKey?.isActive).toBe(true);
    expect(createdApiKey?.usageCount).toBe(0);
    expect(createdApiKey?.name).toMatch(/^API Key - \d{4}-\d{2}-\d{2}T/);
    expect(createdApiKey?.expiresAt).toBeNull(); // No expiration duration provided
  });

  it('should successfully generate API key with an expiration duration', async () => {
    const requestData = {
      email: testUser.email,
      password: 'TestPassword123!',
      expirationDuration: 7, // 7 days
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: requestData,
    });

    expect(response.statusCode).toBe(201);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.apiKey).toBeDefined();

    const createdApiKey = await prisma.apiKey.findUnique({
      where: { key: body.data.apiKey },
    });
    expect(createdApiKey).toBeTruthy();
    expect(createdApiKey?.expiresAt).toBeInstanceOf(Date);
    // Check if expiresAt is approximately 7 days from now
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    // Allow for a small margin of error (e.g., a few seconds)
    expect(createdApiKey?.expiresAt?.getTime()).toBeLessThanOrEqual(
      sevenDaysFromNow.getTime() + 5000
    );
    expect(createdApiKey?.expiresAt?.getTime()).toBeGreaterThanOrEqual(
      sevenDaysFromNow.getTime() - 5000
    );
  });

  it('should handle invalid expiration duration', async () => {
    const requestData = {
      email: testUser.email,
      password: 'TestPassword123!',
      expirationDuration: -1, // Invalid duration
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: requestData,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Number must be greater than 0');
  });

  it('should handle non-integer expiration duration', async () => {
    const requestData = {
      email: testUser.email,
      password: 'TestPassword123!',
      expirationDuration: 7.5, // Non-integer duration
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: requestData,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Expected integer, received float');
  });

  it('should handle non-numeric expiration duration', async () => {
    const requestData = {
      email: testUser.email,
      password: 'TestPassword123!',
      expirationDuration: 'seven' as any, // Non-numeric duration
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: requestData,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Expected number, received string');
  });

  it('should handle validation errors and authentication failures', async () => {
    // Test invalid email format
    const invalidEmailResponse = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: {
        email: 'invalid-email',
        password: 'TestPassword123!',
      },
    });

    expect(invalidEmailResponse.statusCode).toBe(400);
    const invalidEmailBody = JSON.parse(invalidEmailResponse.body);
    expect(invalidEmailBody.success).toBe(false);
    expect(invalidEmailBody.error).toContain('Invalid email format');

    // Test missing email field
    const missingEmailResponse = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: {
        password: 'TestPassword123!',
      },
    });

    expect(missingEmailResponse.statusCode).toBe(400);
    const missingEmailBody = JSON.parse(missingEmailResponse.body);
    expect(missingEmailBody.success).toBe(false);
    expect(missingEmailBody.error).toContain('Email is required');

    // Test missing password field
    const missingPasswordResponse = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: {
        email: 'generate-key-user2@example.com',
      },
    });

    expect(missingPasswordResponse.statusCode).toBe(400);
    const missingPasswordBody = JSON.parse(missingPasswordResponse.body);
    expect(missingPasswordBody.success).toBe(false);
    expect(missingPasswordBody.error).toContain('Password is required');

    // Test non-existent user
    const nonExistentUserResponse = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      },
    });

    expect(nonExistentUserResponse.statusCode).toBe(401);
    const nonExistentUserBody = JSON.parse(nonExistentUserResponse.body);
    expect(nonExistentUserBody.success).toBe(false);
    expect(nonExistentUserBody.error).toBe('Invalid credentials');

    // Test wrong password
    const wrongPasswordResponse = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: {
        email: testUser.email,
        password: 'WrongPassword123!',
      },
    });

    expect(wrongPasswordResponse.statusCode).toBe(401);
    const wrongPasswordBody = JSON.parse(wrongPasswordResponse.body);
    expect(wrongPasswordBody.success).toBe(false);
    expect(wrongPasswordBody.error).toBe('Invalid credentials');
  });

  it('should generate multiple unique API keys for the same user', async () => {
    const requestData = {
      email: testUser.email,
      password: 'TestPassword123!',
    };

    // Generate first API key
    const firstResponse = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: requestData,
    });

    expect(firstResponse.statusCode).toBe(201);
    const firstBody = JSON.parse(firstResponse.body);
    const firstApiKey = firstBody.data.apiKey;

    // Generate second API key
    const secondResponse = await app.inject({
      method: 'POST',
      url: '/api/keys/generate',
      payload: requestData,
    });

    expect(secondResponse.statusCode).toBe(201);
    const secondBody = JSON.parse(secondResponse.body);
    const secondApiKey = secondBody.data.apiKey;

    // Ensure API keys are different
    expect(firstApiKey).not.toBe(secondApiKey);
    expect(firstApiKey).toMatch(/^rdr_[a-f0-9]{128}$/);
    expect(secondApiKey).toMatch(/^rdr_[a-f0-9]{128}$/);

    // Verify both API keys exist in database
    const firstDbKey = await prisma.apiKey.findUnique({
      where: { key: firstApiKey },
    });
    const secondDbKey = await prisma.apiKey.findUnique({
      where: { key: secondApiKey },
    });

    expect(firstDbKey).toBeTruthy();
    expect(secondDbKey).toBeTruthy();
    expect(firstDbKey?.userId).toBe(testUser.id);
    expect(secondDbKey?.userId).toBe(testUser.id);
  });
});
