import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { prisma } from '../../utils/prisma';
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../../lib/auth';
import apiKeyController from '../../controller/api/apiKeyController';

describe('API Key Update Endpoint', () => {
  let app: FastifyInstance;
  let testUser: any;
  let testApiKey: any;

  beforeAll(async () => {
    app = Fastify();
    await app.register(apiKeyController, { prefix: '/api/keys' });
    await app.ready();
  });

  beforeEach(async () => {
    // Clean up test data in correct order due to foreign key constraints
    await prisma.apiKey.deleteMany({
      where: {
        user: {
          email: {
            contains: 'update-key',
          },
        },
      },
    });

    await prisma.alert.deleteMany({
      where: {
        user: {
          email: {
            contains: 'update-key',
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'update-key',
        },
      },
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', SALT_ROUNDS);
    testUser = await prisma.user.create({
      data: {
        email: 'update-key@update.com',
        password: hashedPassword,
      },
    });

    // Create test API key
    testApiKey = await prisma.apiKey.create({
      data: {
        key:
          'rdr_' +
          Buffer.from(
            'test-update-key-1234567890abcdef1234567890abcdef12345678'
          )
            .toString('hex')
            .substring(0, 64),
        name: 'Original Test Key Name',
        userId: testUser.id,
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should successfully update API key name with valid credentials and ownership', async () => {
    const newName = 'Updated Test Key Name';

    const response = await app.inject({
      method: 'PUT',
      url: `/api/keys/update/${testApiKey.id}`,
      payload: {
        email: 'update-key@update.com',
        password: 'TestPassword123!',
        name: newName,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.message).toBe('API key updated successfully');
    expect(body.data.apiKey).toBeDefined();
    expect(body.data.apiKey.id).toBe(testApiKey.id);
    expect(body.data.apiKey.name).toBe(newName);
    expect(body.data.apiKey.updatedAt).toBeDefined();

    // Verify the API key was actually updated in the database
    const updatedApiKey = await prisma.apiKey.findUnique({
      where: {
        id: testApiKey.id,
      },
    });
    expect(updatedApiKey).not.toBeNull();
    expect(updatedApiKey?.name).toBe(newName);
    expect(updatedApiKey?.updatedAt).not.toEqual(testApiKey.updatedAt);
  });

  it('should handle validation errors for invalid input', async () => {
    const testCases = [
      {
        name: 'missing email',
        payload: {
          password: 'TestPassword123!',
          name: 'New Name',
        },
        expectedError: 'Email is required',
      },
      {
        name: 'invalid email format',
        payload: {
          email: 'invalid-email',
          password: 'TestPassword123!',
          name: 'New Name',
        },
        expectedError: 'Invalid email format',
      },
      {
        name: 'missing password',
        payload: {
          email: 'update-key@update.com',
          name: 'New Name',
        },
        expectedError: 'Password is required',
      },
      {
        name: 'missing name',
        payload: {
          email: 'update-key@update.com',
          password: 'TestPassword123!',
        },
        expectedError: 'API key name is required',
      },
      {
        name: 'empty name',
        payload: {
          email: 'update-key@update.com',
          password: 'TestPassword123!',
          name: '',
        },
        expectedError: 'API key name cannot be empty',
      },
      {
        name: 'name too long',
        payload: {
          email: 'update-key@update.com',
          password: 'TestPassword123!',
          name: 'a'.repeat(101), // 101 characters, exceeds 100 character limit
        },
        expectedError: 'API key name cannot exceed 100 characters',
      },
    ];

    for (const testCase of testCases) {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/keys/update/${testApiKey.id}`,
        payload: testCase.payload,
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe(testCase.expectedError);
    }

    // Verify the original API key name remains unchanged after validation errors
    const unchangedApiKey = await prisma.apiKey.findUnique({
      where: {
        id: testApiKey.id,
      },
    });
    expect(unchangedApiKey?.name).toBe('Original Test Key Name');
  });

  it('should handle authentication errors for invalid credentials', async () => {
    const testCases = [
      {
        name: 'non-existent user email',
        payload: {
          email: 'nonexistent@test.com',
          password: 'TestPassword123!',
          name: 'New Name',
        },
      },
      {
        name: 'incorrect password',
        payload: {
          email: 'update-key@update.com',
          password: 'WrongPassword123!',
          name: 'New Name',
        },
      },
    ];

    for (const testCase of testCases) {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/keys/update/${testApiKey.id}`,
        payload: testCase.payload,
      });

      expect(response.statusCode).toBe(401);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid credentials');
    }

    // Verify the API key name remains unchanged after failed authentication
    const unchangedApiKey = await prisma.apiKey.findUnique({
      where: {
        id: testApiKey.id,
      },
    });
    expect(unchangedApiKey?.name).toBe('Original Test Key Name');
  });

  it('should handle invalid UUID format in URL parameter', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/keys/update/invalid-uuid-format',
      payload: {
        email: 'update-key@update.com',
        password: 'TestPassword123!',
        name: 'New Name',
      },
    });

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid API key ID format in params');
  });

  it('should handle API key not found or access denied errors', async () => {
    // Create another user to test access control
    const hashedPassword = await bcrypt.hash('TestPassword123!', SALT_ROUNDS);
    const otherUser = await prisma.user.create({
      data: {
        email: 'other-update-key@update.com',
        password: hashedPassword,
      },
    });

    const testCases = [
      {
        name: 'non-existent API key ID',
        payload: {
          email: 'update-key@update.com',
          password: 'TestPassword123!',
          name: 'New Name',
        },
        apiKeyId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format but doesn't exist
      },
      {
        name: 'API key belongs to different user',
        payload: {
          email: 'other-update-key@update.com',
          password: 'TestPassword123!',
          name: 'New Name',
        },
        apiKeyId: testApiKey.id, // This belongs to testUser, not otherUser
      },
    ];

    for (const testCase of testCases) {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/keys/update/${testCase.apiKeyId}`,
        payload: testCase.payload,
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('API key not found or access denied');
    }

    // Verify the original API key name remains unchanged after failed attempts
    const unchangedApiKey = await prisma.apiKey.findUnique({
      where: {
        id: testApiKey.id,
      },
    });
    expect(unchangedApiKey?.name).toBe('Original Test Key Name');

    // Clean up the other user
    await prisma.user.delete({
      where: {
        id: otherUser.id,
      },
    });
  });

  it('should update multiple API keys independently', async () => {
    // Create a second API key for the same user
    const secondApiKey = await prisma.apiKey.create({
      data: {
        key:
          'rdr_' +
          Buffer.from(
            'test-update-key-2-34567890abcdef1234567890abcdef12345678'
          )
            .toString('hex')
            .substring(0, 64),
        name: 'Second Original Name',
        userId: testUser.id,
      },
    });

    // Update the first API key
    const firstResponse = await app.inject({
      method: 'PUT',
      url: `/api/keys/update/${testApiKey.id}`,
      payload: {
        email: 'update-key@update.com',
        password: 'TestPassword123!',
        name: 'First Updated Name',
      },
    });

    expect(firstResponse.statusCode).toBe(200);

    const firstBody = JSON.parse(firstResponse.body);
    expect(firstBody.data.apiKey.name).toBe('First Updated Name');

    // Verify first key is updated but second key remains unchanged
    const firstUpdated = await prisma.apiKey.findUnique({
      where: { id: testApiKey.id },
    });
    const secondUnchanged = await prisma.apiKey.findUnique({
      where: { id: secondApiKey.id },
    });

    expect(firstUpdated?.name).toBe('First Updated Name');
    expect(secondUnchanged?.name).toBe('Second Original Name');

    // Update the second API key
    const secondResponse = await app.inject({
      method: 'PUT',
      url: `/api/keys/update/${secondApiKey.id}`,
      payload: {
        email: 'update-key@update.com',
        password: 'TestPassword123!',
        name: 'Second Updated Name',
      },
    });

    expect(secondResponse.statusCode).toBe(200);

    const secondBody = JSON.parse(secondResponse.body);
    expect(secondBody.data.apiKey.name).toBe('Second Updated Name');

    // Verify both keys have their respective updated names
    const firstFinal = await prisma.apiKey.findUnique({
      where: { id: testApiKey.id },
    });
    const secondFinal = await prisma.apiKey.findUnique({
      where: { id: secondApiKey.id },
    });

    expect(firstFinal?.name).toBe('First Updated Name');
    expect(secondFinal?.name).toBe('Second Updated Name');
  });

  it('should handle edge cases for API key names', async () => {
    const edgeCases = [
      {
        name: 'single character name',
        newName: 'A',
        shouldSucceed: true,
      },
      {
        name: 'name with spaces',
        newName: 'My API Key Name',
        shouldSucceed: true,
      },
      {
        name: 'name with special characters',
        newName: 'API-Key_2024@Production!',
        shouldSucceed: true,
      },
      {
        name: 'name with unicode characters',
        newName: 'API Key 🔑 测试',
        shouldSucceed: true,
      },
      {
        name: 'maximum length name (100 characters)',
        newName: 'a'.repeat(100),
        shouldSucceed: true,
      },
      {
        name: 'name with only spaces',
        newName: '   ',
        shouldSucceed: true, // Spaces are valid characters
      },
    ];

    for (const testCase of edgeCases) {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/keys/update/${testApiKey.id}`,
        payload: {
          email: 'update-key@update.com',
          password: 'TestPassword123!',
          name: testCase.newName,
        },
      });

      if (testCase.shouldSucceed) {
        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.data.apiKey.name).toBe(testCase.newName);

        // Verify database update
        const updatedKey = await prisma.apiKey.findUnique({
          where: { id: testApiKey.id },
        });
        expect(updatedKey?.name).toBe(testCase.newName);
      }
    }
  });
});
