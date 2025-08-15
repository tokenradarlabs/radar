import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../../utils/prisma";
import { Response } from "../../types/responses";
import { handleControllerError } from "../../utils/responseHelper";

// Define the request schema
const getApiKeysRequestSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string"
  })
});

// Define the usage analytics request schema
const getUsageAnalyticsRequestSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string"
  }),
  apiKeyId: z.string({
    required_error: "API key ID is required",
    invalid_type_error: "API key ID must be a string"
  }).uuid("Invalid API key ID format").optional()
});

// Type inference from the Zod schemas
type GetApiKeysRequest = z.infer<typeof getApiKeysRequestSchema>;
type GetUsageAnalyticsRequest = z.infer<typeof getUsageAnalyticsRequestSchema>;

// Type for API key list response
interface ApiKeyListResponse {
  apiKeys: {
    id: string;
    key: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date;
    usageCount: number;
    isActive: boolean;
  }[];
}

// Type for usage analytics response
interface UsageAnalyticsResponse {
  totalApiKeys: number;
  totalUsage: number;
  activeApiKeys: number;
  inactiveApiKeys: number;
  mostUsedApiKey: {
    id: string;
    name: string;
    usageCount: number;
    lastUsedAt: Date;
  } | null;
  leastUsedApiKey: {
    id: string;
    name: string;
    usageCount: number;
    lastUsedAt: Date;
  } | null;
  averageUsagePerKey: number;
  apiKeyDetails: Array<{
    id: string;
    name: string;
    usageCount: number;
    lastUsedAt: Date;
    isActive: boolean;
    createdAt: Date;
  }>;
}

export default async function getApiKeysController(fastify: FastifyInstance) {
  fastify.post<{ Body: GetApiKeysRequest }>(
    "/getApiKeys",
    async function (request: FastifyRequest<{ Body: GetApiKeysRequest }>, reply: FastifyReply) {
      try {
        // Validate the request body against the schema
        const validatedData = getApiKeysRequestSchema.parse(request.body);

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: validatedData.email
          }
        });

        // If user doesn't exist, return error
        if (!user) {
          const response: Response<ApiKeyListResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Compare password with hashed password
        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

        // If password is invalid, return error
        if (!isValidPassword) {
          const response: Response<ApiKeyListResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Fetch API keys for the user
        const apiKeys = await prisma.apiKey.findMany({
          where: {
            userId: user.id
          },
          select: {
            id: true,
            key: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            lastUsedAt: true,
            usageCount: true,
            isActive: true
          }
        });

        // Return the API keys
        const response: Response<ApiKeyListResponse> = {
          success: true,
          data: {
            apiKeys
          }
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Return validation errors
          const response: Response<ApiKeyListResponse> = {
            success: false,
            error: error.errors[0].message
          };
          return reply.code(400).send(response);
        }

        handleControllerError(reply, error, "Internal server error");
        return;
      }
    }
  );

  // GET endpoint for API key usage analytics
  fastify.post<{ Body: GetUsageAnalyticsRequest }>(
    "/usageAnalytics",
    async function (request: FastifyRequest<{ Body: GetUsageAnalyticsRequest }>, reply: FastifyReply) {
      try {
        const validatedData = getUsageAnalyticsRequestSchema.parse(request.body);

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: validatedData.email
          }
        });

        if (!user) {
          const response: Response<UsageAnalyticsResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Compare password with hashed password
        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

        if (!isValidPassword) {
          const response: Response<UsageAnalyticsResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Build where clause for API keys
        const whereClause: any = {
          userId: user.id
        };

        // If specific API key ID is provided, filter by it
        if (validatedData.apiKeyId) {
          whereClause.id = validatedData.apiKeyId;
        }

        // Get all API keys for the user with usage data
        const apiKeys = await prisma.apiKey.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            usageCount: true,
            lastUsedAt: true,
            isActive: true,
            createdAt: true
          },
          orderBy: {
            usageCount: 'desc'
          }
        });

        if (apiKeys.length === 0) {
          const response: Response<UsageAnalyticsResponse> = {
            success: false,
            error: "No API keys found"
          };
          return reply.code(404).send(response);
        }

        // Calculate analytics
        const totalApiKeys = apiKeys.length;
        const totalUsage = apiKeys.reduce((sum, key) => sum + key.usageCount, 0);
        const activeApiKeys = apiKeys.filter(key => key.isActive).length;
        const inactiveApiKeys = totalApiKeys - activeApiKeys;
        const averageUsagePerKey = totalUsage / totalApiKeys;

        // Find most and least used API keys
        const mostUsedApiKey = apiKeys[0]; // Already sorted by usage count desc
        const leastUsedApiKey = apiKeys[apiKeys.length - 1];

        const response: Response<UsageAnalyticsResponse> = {
          success: true,
          data: {
            totalApiKeys,
            totalUsage,
            activeApiKeys,
            inactiveApiKeys,
            mostUsedApiKey: {
              id: mostUsedApiKey.id,
              name: mostUsedApiKey.name,
              usageCount: mostUsedApiKey.usageCount,
              lastUsedAt: mostUsedApiKey.lastUsedAt
            },
            leastUsedApiKey: {
              id: leastUsedApiKey.id,
              name: leastUsedApiKey.name,
              usageCount: leastUsedApiKey.usageCount,
              lastUsedAt: leastUsedApiKey.lastUsedAt
            },
            averageUsagePerKey: Math.round(averageUsagePerKey * 100) / 100, // Round to 2 decimal places
            apiKeyDetails: apiKeys
          }
        };

        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response: Response<UsageAnalyticsResponse> = {
            success: false,
            error: error.errors[0].message
          };
          return reply.code(400).send(response);
        }

        handleControllerError(reply, error, "Internal server error");
        return;
      }
    }
  );
} 