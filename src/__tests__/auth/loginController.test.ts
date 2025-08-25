import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { prisma } from '../../utils/prisma'
import { loginController } from '../../controller/auth'

describe('User Login Endpoint', () => {
  let app: FastifyInstance
  
  beforeAll(async () => {
    app = Fastify()
    await app.register(loginController, { prefix: '/auth' })
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
            contains: 'login'
          }
        }
      }
    })
    
    await prisma.alert.deleteMany({
      where: {
        user: {
          email: {
            contains: 'login'
          }
        }
      }
    })
    
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'login'
        }
      }
    })
  })

  it('should successfully login with valid credentials', async () => {
    const testUser = {
      email: 'login@example.com',
      password: 'TestPassword123!'
    }

    const hashedPassword = await bcrypt.hash(testUser.password, 12)
    const createdUser = await prisma.user.create({
      data: {
        email: testUser.email,
        password: hashedPassword
      }
    })

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: testUser
    })

    expect(response.statusCode).toBe(200)
    
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data.email).toBe(testUser.email)
    expect(body.data.id).toBe(createdUser.id)
    expect(body.data.createdAt).toBeDefined()
    expect(body.data.token).toBeDefined()
    expect(typeof body.data.token).toBe('string')
    expect(body.data.token.length).toBeGreaterThan(0)
    
    expect(body.data.password).toBeUndefined()
  })

  it('should handle validation errors and authentication failures', async () => {
    const invalidEmailResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'invalid-email',
        password: 'TestPassword123!'
      }
    })

    expect(invalidEmailResponse.statusCode).toBe(400)
    const invalidEmailBody = JSON.parse(invalidEmailResponse.body)
    expect(invalidEmailBody.success).toBe(false)
    expect(invalidEmailBody.error).toContain('Invalid email format')

    const missingEmailResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
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
      url: '/auth/login',
      payload: {
        email: 'login@example.com'
      }
    })

    expect(missingPasswordResponse.statusCode).toBe(400)
    const missingPasswordBody = JSON.parse(missingPasswordResponse.body)
    expect(missingPasswordBody.success).toBe(false)
    expect(missingPasswordBody.error).toContain('Password is required')

    const nonExistentUserResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!'
      }
    })

    expect(nonExistentUserResponse.statusCode).toBe(401)
    const nonExistentUserBody = JSON.parse(nonExistentUserResponse.body)
    expect(nonExistentUserBody.success).toBe(false)
    expect(nonExistentUserBody.error).toContain('User Does Not Exist')

    const testUser = {
      email: 'login-test3@example.com',
      password: 'TestPassword123!'
    }

    const hashedPassword = await bcrypt.hash(testUser.password, 12)
    await prisma.user.create({
      data: {
        email: testUser.email,
        password: hashedPassword
      }
    })

    const wrongPasswordResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: testUser.email,
        password: 'WrongPassword123!'
      }
    })

    expect(wrongPasswordResponse.statusCode).toBe(401)
    const wrongPasswordBody = JSON.parse(wrongPasswordResponse.body)
    expect(wrongPasswordBody.success).toBe(false)
    expect(wrongPasswordBody.error).toBe('Invalid credentials')
  })
})
