import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../utils/prisma'
import { profileController } from '../../controller/auth'
import { getValidatedEnv } from '../../utils/envValidation'

describe('User Profile Endpoint', () => {
  let app: FastifyInstance
  let testUser: any
  let validToken: string
  
  beforeAll(async () => {
    app = Fastify()
    await app.register(profileController, { prefix: '/auth' })
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
            contains: 'profile'
          }
        }
      }
    })
    
    await prisma.alert.deleteMany({
      where: {
        user: {
          email: {
            contains: 'profile'
          }
        }
      }
    })
    
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'profile'
        }
      }
    })

    const hashedPassword = await bcrypt.hash('TestPassword123!', 12)
    testUser = await prisma.user.create({
      data: {
        email: 'profile-test@example.com',
        password: hashedPassword
      }
    })

    const { JWT_SECRET } = getValidatedEnv()
    validToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    )
  })

  it('should successfully return user profile with valid authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/profile',
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    expect(response.statusCode).toBe(200)
    
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
    expect(body.data.id).toBe(testUser.id)
    expect(body.data.email).toBe(testUser.email)
    expect(body.data.createdAt).toBeDefined()
    expect(body.data.updatedAt).toBeDefined()
    expect(body.data._count).toBeDefined()
    expect(body.data._count.alerts).toBeDefined()
    expect(body.data._count.apiKeys).toBeDefined()
    
    expect(body.data.password).toBeUndefined()
  })

  it('should handle authentication errors and invalid tokens', async () => {
    const noAuthResponse = await app.inject({
      method: 'GET',
      url: '/auth/profile'
    })

    expect(noAuthResponse.statusCode).toBe(401)
    const noAuthBody = JSON.parse(noAuthResponse.body)
    expect(noAuthBody.success).toBe(false)
    expect(noAuthBody.error).toContain('Authentication required')

    const malformedAuthResponse = await app.inject({
      method: 'GET',
      url: '/auth/profile',
      headers: {
        authorization: validToken // Missing "Bearer " prefix
      }
    })

    expect(malformedAuthResponse.statusCode).toBe(401)
    const malformedAuthBody = JSON.parse(malformedAuthResponse.body)
    expect(malformedAuthBody.success).toBe(false)
    expect(malformedAuthBody.error).toContain('Invalid or expired token')

    const invalidTokenResponse = await app.inject({
      method: 'GET',
      url: '/auth/profile',
      headers: {
        authorization: 'Bearer invalid-token'
      }
    })

    expect(invalidTokenResponse.statusCode).toBe(401)
    const invalidTokenBody = JSON.parse(invalidTokenResponse.body)
    expect(invalidTokenBody.success).toBe(false)
    expect(invalidTokenBody.error).toContain('Invalid or expired token')

    const { JWT_SECRET } = getValidatedEnv()
    const expiredToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      JWT_SECRET,
      { expiresIn: -1 }
    )

    const expiredTokenResponse = await app.inject({
      method: 'GET',
      url: '/auth/profile',
      headers: {
        authorization: `Bearer ${expiredToken}`
      }
    })

    expect(expiredTokenResponse.statusCode).toBe(401)
    const expiredTokenBody = JSON.parse(expiredTokenResponse.body)
    expect(expiredTokenBody.success).toBe(false)
    expect(expiredTokenBody.error).toContain('Invalid or expired token')

    await prisma.user.delete({
      where: { id: testUser.id }
    })

    const deletedUserResponse = await app.inject({
      method: 'GET',
      url: '/auth/profile',
      headers: {
        authorization: `Bearer ${validToken}`
      }
    })

    expect(deletedUserResponse.statusCode).toBe(404)
    const deletedUserBody = JSON.parse(deletedUserResponse.body)
    expect(deletedUserBody.success).toBe(false)
    expect(deletedUserBody.error).toBe('User not found')
  })
})
