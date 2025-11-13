import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { validateEnvironmentVariables } from './envValidation';
import { prisma } from './prisma';
import { sendUnauthorized, sendInternalError } from './responseHelper';

// Define the shape of the token payload
export interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

// This middleware can be used to protect routes that require authentication
export async function authenticateJwt(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return sendUnauthorized(reply, 'Authentication required');
  }

  const token = authHeader.split(' ')[1]; // Extract the token from "Bearer <token>"
  const { JWT_SECRET } = validateEnvironmentVariables();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.user = decoded; // Attach user info to the request
    return;
  } catch (error) {
    return sendUnauthorized(reply, 'Invalid or expired token');
  }
}

// This middleware can be used to protect API routes that require API key authentication
export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey =
    (request.headers['x-api-key'] as string) ||
    ((request.query as any)?.['api_key'] as string);

  if (!apiKey) {
    return reply.code(401).send({
      success: false,
      error:
        "API key required. Provide it in the 'x-api-key' header or 'api_key' query parameter.",
    });
  }

  try {
    // Find the API key in the database
    const foundApiKey = await prisma.apiKey.findUnique({
      where: {
        key: apiKey,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!foundApiKey) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid or inactive API key',
      });
    }

    // Check for API key expiration
    if (foundApiKey.expiresAt && foundApiKey.expiresAt < new Date()) {
      return reply.code(401).send({
        success: false,
        error: 'Expired API key',
      });
    }

    // Update the last used timestamp and increment usage count
    await prisma.apiKey.update({
      where: {
        id: foundApiKey.id,
      },
      data: {
        lastUsedAt: new Date(),
        usageCount: {
          increment: 1,
        },
      },
    });

    // Attach API key and user info to the request
    request.apiKey = foundApiKey;
    request.apiUser = foundApiKey.user;
    return;
  } catch (error) {
    // Re-throw the error to be caught by Fastify's global error handler
    throw error;
  }
}

// This function generates a new JWT token
export function generateToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  expiresIn: string | number = '1h'
): string {
  const { JWT_SECRET } = validateEnvironmentVariables();
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, { expiresIn });
}

// Declare module augmentation to add user property to FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
    apiKey?: {
      id: string;
      key: string;
      name: string;
      createdAt: Date;
      lastUsedAt: Date;
      usageCount: number;
      isActive: boolean;
      userId: string;
      expiresAt?: Date; // Add expiresAt to the type definition
      rateLimit: number; // Add rateLimit to the type definition
      user: {
        id: string;
        email: string;
      };
    };
    apiUser?: {
      id: string;
      email: string;
    };
  }
}
