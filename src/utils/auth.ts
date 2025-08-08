import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

import { getValidatedEnv } from "./envValidation";
import { prisma } from "./prisma";

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
    return reply.code(401).send({
      success: false,
      error: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1]; // Extract the token from "Bearer <token>"

  const { JWT_SECRET } = getValidatedEnv();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.user = decoded; // Attach user info to the request
    return;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: "Invalid or expired token",
    });
  }
}

// This middleware can be used to protect API routes that require API key authentication
export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey =
    (request.headers["x-api-key"] as string) ||
    ((request.query as any)?.["api_key"] as string);

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
        error: "Invalid or inactive API key",
      });
    }

    // Update the last used timestamp
    await prisma.apiKey.update({
      where: {
        id: foundApiKey.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    // Attach API key and user info to the request
    request.apiKey = foundApiKey;
    request.apiUser = foundApiKey.user;
    return;
  } catch (error) {
    console.error("API key authentication error:", error);
    return reply.code(500).send({
      success: false,
      error: "Internal server error",
    });
  }
}

// This function generates a new JWT token
export function generateToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  expiresIn: number = 24 * 60 * 60
): string {
  const { JWT_SECRET } = getValidatedEnv();

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Declare module augmentation to add user property to FastifyRequest
declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
    apiKey?: {
      id: string;
      key: string;
      name: string;
      createdAt: Date;
      lastUsedAt: Date;
      isActive: boolean;
      userId: string;
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
