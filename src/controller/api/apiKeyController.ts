import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../utils/prisma";
import { Response } from "../../types/responses";

// Define the API key request schema
const apiKeyRequestSchema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string"
  }).email("Invalid email format"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string"
  })
});

// Type inference from the Zod schema
type ApiKeyRequest = z.infer<typeof apiKeyRequestSchema>;

// Type for API key response
interface ApiKeyResponse {
  apiKey: string;
}

// Generate a secure API key
function generateApiKey(): string {
  return `rdr_${crypto.randomBytes(32).toString('hex')}`;
}

// Generate a default name for the API key
function generateKeyName(): string {
  return `API Key - ${new Date().toISOString()}`;
}

export default async function apiKeyController(fastify: FastifyInstance) {
  fastify.post<{ Body: ApiKeyRequest }>(
    "/generate",
    async function (request: FastifyRequest<{ Body: ApiKeyRequest }>, reply: FastifyReply) {
      try {
        // Validate the request body against the schema
        const validatedData = apiKeyRequestSchema.parse(request.body);

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: validatedData.email
          }
        });

        // If user doesn't exist, return error
        if (!user) {
          const response: Response<ApiKeyResponse> = {
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Compare password with hashed password
        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

        // If password is invalid, return error
        if (!isValidPassword) {
          const response: Response<ApiKeyResponse> = {
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Generate and store new API key
        const apiKey = generateApiKey();
        const newApiKey = await prisma.apiKey.create({
          data: {
            key: apiKey,
            name: generateKeyName(),
            userId: user.id
          }
        });

        // Return the API key
        const response: Response<ApiKeyResponse> = {
          data: {
            apiKey: newApiKey.key
          }
        };
        return reply.code(201).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Return validation errors
          const response: Response<ApiKeyResponse> = {
            error: error.errors[0].message
          };
          return reply.code(400).send(response);
        }

        // Handle unexpected errors
        console.error('API key generation error:', error);
        const response: Response<ApiKeyResponse> = {
          error: "Internal server error"
        };
        return reply.code(500).send(response);
      }
    }
  );
} 