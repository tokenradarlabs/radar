import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import { prisma } from "../../utils/prisma";
import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "../../lib/auth";
import apiKeyController from "../../controller/api/apiKeyController";

describe("API Key Delete Endpoint", () => {
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
            contains: 'delete-key'
          }
        }
      }
    });
    
    await prisma.alert.deleteMany({
      where: {
        user: {
          email: {
            contains: 'delete-key'
          }
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'delete-key'
        }
      }
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', SALT_ROUNDS);
    testUser = await prisma.user.create({
      data: {
        email: 'delete-key@delete.com',
        password: hashedPassword
      }
    });

    // Create test API key
    testApiKey = await prisma.apiKey.create({
      data: {
        key: 'rdr_' + Buffer.from('test-delete-key-1234567890abcdef1234567890abcdef12345678').toString('hex').substring(0, 64),
        name: 'Test Delete Key',
        userId: testUser.id
      }
    });
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  it('should successfully delete API key with valid credentials and ownership', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/keys/delete/${testApiKey.id}`,
      payload: {
        email: 'delete-key@delete.com',
        password: 'TestPassword123!'
      }
    })

    expect(response.statusCode).toBe(200)
    
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data.message).toBe("API key deleted successfully")

    // Verify the API key was actually deleted from the database
    const deletedApiKey = await prisma.apiKey.findUnique({
      where: {
        id: testApiKey.id
      }
    })
    expect(deletedApiKey).toBeNull()
  })

  it('should handle validation errors for invalid input', async () => {
    const testCases = [
      {
        name: 'missing email',
        payload: {
          password: 'TestPassword123!'
        },
        expectedError: 'Email is required'
      },
      {
        name: 'invalid email format',
        payload: {
          email: 'invalid-email',
          password: 'TestPassword123!'
        },
        expectedError: 'Invalid email format'
      },
      {
        name: 'missing password',
        payload: {
          email: 'delete-key@delete.com'
        },
        expectedError: 'Password is required'
      },
      {
        name: 'invalid UUID format for API key ID',
        payload: {
          email: 'delete-key@delete.com',
          password: 'TestPassword123!'
        },
        url: '/api/keys/delete/invalid-uuid-format',
        expectedError: 'Invalid API key ID format'
      }
    ];

    for (const testCase of testCases) {
      const response = await app.inject({
        method: 'DELETE',
        url: testCase.url || `/api/keys/delete/${testApiKey.id}`,
        payload: testCase.payload
      })

      expect(response.statusCode).toBe(400)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toBe(testCase.expectedError)
    }
  })

  it('should handle authentication errors for invalid credentials', async () => {
    const testCases = [
      {
        name: 'non-existent user email',
        payload: {
          email: 'nonexistent@delete.com',
          password: 'TestPassword123!'
        }
      },
      {
        name: 'incorrect password',
        payload: {
          email: 'delete-key@delete.com',
          password: 'WrongPassword123!'
        }
      }
    ];

    for (const testCase of testCases) {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/keys/delete/${testApiKey.id}`,
        payload: testCase.payload
      })

      expect(response.statusCode).toBe(401)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toBe("Invalid credentials")
    }

    // Verify the API key still exists after failed authentication
    const apiKeyStillExists = await prisma.apiKey.findUnique({
      where: {
        id: testApiKey.id
      }
    })
    expect(apiKeyStillExists).not.toBeNull()
  })

  it('should handle API key not found or access denied errors', async () => {
    // Create another user to test access control
    const hashedPassword = await bcrypt.hash('TestPassword123!', SALT_ROUNDS);
    const otherUser = await prisma.user.create({
      data: {
        email: 'other-delete-key@delete.com',
        password: hashedPassword
      }
    });

    const testCases = [
      {
        name: 'non-existent API key ID',
        payload: {
          email: 'delete-key@delete.com',
          password: 'TestPassword123!'
        },
        apiKeyId: '550e8400-e29b-41d4-a716-446655440000' // Valid UUID format but doesn't exist
      },
      {
        name: 'API key belongs to different user',
        payload: {
          email: 'other-delete-key@delete.com',
          password: 'TestPassword123!'
        },
        apiKeyId: testApiKey.id // This belongs to testUser, not otherUser
      }
    ];

    for (const testCase of testCases) {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/keys/delete/${testCase.apiKeyId}`,
        payload: testCase.payload
      })

      expect(response.statusCode).toBe(404)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toBe("API key not found or access denied")
    }

    // Verify the original API key still exists after failed attempts
    const apiKeyStillExists = await prisma.apiKey.findUnique({
      where: {
        id: testApiKey.id
      }
    })
    expect(apiKeyStillExists).not.toBeNull()

    // Clean up the other user
    await prisma.user.delete({
      where: {
        id: otherUser.id
      }
    })
  })

  it('should delete multiple API keys independently', async () => {
    // Create a second API key for the same user
    const secondApiKey = await prisma.apiKey.create({
      data: {
        key: 'rdr_' + Buffer.from('test-delete-key-2-34567890abcdef1234567890abcdef12345678').toString('hex').substring(0, 64),
        name: 'Test Delete Key 2',
        userId: testUser.id
      }
    });

    // Delete the first API key
    const firstResponse = await app.inject({
      method: 'DELETE',
      url: `/api/keys/delete/${testApiKey.id}`,
      payload: {
        email: 'delete-key@delete.com',
        password: 'TestPassword123!'
      }
    })

    expect(firstResponse.statusCode).toBe(200)
    
    // Verify first key is deleted but second key still exists
    const firstDeleted = await prisma.apiKey.findUnique({
      where: { id: testApiKey.id }
    })
    const secondExists = await prisma.apiKey.findUnique({
      where: { id: secondApiKey.id }
    })
    
    expect(firstDeleted).toBeNull()
    expect(secondExists).not.toBeNull()

    // Delete the second API key
    const secondResponse = await app.inject({
      method: 'DELETE',
      url: `/api/keys/delete/${secondApiKey.id}`,
      payload: {
        email: 'delete-key@delete.com',
        password: 'TestPassword123!'
      }
    })

    expect(secondResponse.statusCode).toBe(200)
    
    // Verify both keys are now deleted
    const secondDeleted = await prisma.apiKey.findUnique({
      where: { id: secondApiKey.id }
    })
    
    expect(secondDeleted).toBeNull()
  })
})
