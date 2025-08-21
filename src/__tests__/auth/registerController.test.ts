import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma'
import { registerController } from '../../controller/auth'

describe('User Registration Endpoint', () => {
  let app: FastifyInstance
  
  beforeAll(async () => {
    app = Fastify()
    await app.register(registerController, { prefix: '/auth' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up test data in correct order due to foreign key constraints
    await prisma.apiKey.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test'
          }
        }
      }
    })
    
    await prisma.alert.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test'
          }
        }
      }
    })
    
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    })
  })

  it('should successfully register a new user with valid data', async () => {
    const testUser = {
      email: 'test@example.com',
      password: 'TestPassword123!'
    }

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: testUser
    })

    expect(response.statusCode).toBe(201)
    
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data.email).toBe(testUser.email)
    expect(body.data.id).toBeDefined()
    expect(body.data.createdAt).toBeDefined()
    
    const createdUser = await prisma.user.findUnique({
      where: { email: testUser.email }
    })
    expect(createdUser).toBeTruthy()
    expect(createdUser?.email).toBe(testUser.email)
    
    expect(createdUser?.password).not.toBe(testUser.password)
    expect(createdUser?.password.length).toBeGreaterThan(20)
  })

  it('should handle validation errors and duplicate email registration', async () => {
    const invalidEmailResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'invalid-email',
        password: 'TestPassword123!'
      }
    })

    expect(invalidEmailResponse.statusCode).toBe(400)
    const invalidEmailBody = JSON.parse(invalidEmailResponse.body)
    expect(invalidEmailBody.success).toBe(false)
    expect(invalidEmailBody.error).toContain('Invalid email format')

    const shortPasswordResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test2@example.com',
        password: 'short'
      }
    })

    expect(shortPasswordResponse.statusCode).toBe(400)
    const shortPasswordBody = JSON.parse(shortPasswordResponse.body)
    expect(shortPasswordBody.success).toBe(false)
    expect(shortPasswordBody.error).toContain('Password must be at least 8 characters long')

    const noUppercaseResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test3@example.com',
        password: 'testpassword123!'
      }
    })

    expect(noUppercaseResponse.statusCode).toBe(400)
    const noUppercaseBody = JSON.parse(noUppercaseResponse.body)
    expect(noUppercaseBody.success).toBe(false)
    expect(noUppercaseBody.error).toContain('Password must contain at least one uppercase letter')

    const noNumberResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test4@example.com',
        password: 'TestPassword!'
      }
    })

    expect(noNumberResponse.statusCode).toBe(400)
    const noNumberBody = JSON.parse(noNumberResponse.body)
    expect(noNumberBody.success).toBe(false)
    expect(noNumberBody.error).toContain('Password must contain at least one number')

    const noSpecialResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test5@example.com',
        password: 'TestPassword123'
      }
    })

    expect(noSpecialResponse.statusCode).toBe(400)
    const noSpecialBody = JSON.parse(noSpecialResponse.body)
    expect(noSpecialBody.success).toBe(false)
    expect(noSpecialBody.error).toContain('Password must contain at least one special character')

    const missingEmailResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        password: 'TestPassword123!'
      }
    })

    expect(missingEmailResponse.statusCode).toBe(400)
    const missingEmailBody = JSON.parse(missingEmailResponse.body)
    expect(missingEmailBody.success).toBe(false)
    expect(missingEmailBody.error).toContain('Email is required')

    const missingPasswordResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test6@example.com'
      }
    })

    expect(missingPasswordResponse.statusCode).toBe(400)
    const missingPasswordBody = JSON.parse(missingPasswordResponse.body)
    expect(missingPasswordBody.success).toBe(false)
    expect(missingPasswordBody.error).toContain('Password is required')

    const validUser = {
      email: 'duplicate@test.com',
      password: 'TestPassword123!'
    }

    const firstRegistration = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: validUser
    })

    expect(firstRegistration.statusCode).toBe(201)

    const duplicateResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: validUser
    })

    expect(duplicateResponse.statusCode).toBe(409)
    const duplicateBody = JSON.parse(duplicateResponse.body)
    expect(duplicateBody.success).toBe(false)
    expect(duplicateBody.error).toBe('Email already exists')
  })
})
