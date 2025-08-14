import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../utils/prisma";
import { Response } from "../../types/responses";
import { handleControllerError } from "../../utils/responseHelper";

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

// Define the API key deletion request schema
const deleteApiKeyRequestSchema = z.object({
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
  }).uuid("Invalid API key ID format")
});

// Type inference from the Zod schemas
type ApiKeyRequest = z.infer<typeof apiKeyRequestSchema>;
type DeleteApiKeyRequest = z.infer<typeof deleteApiKeyRequestSchema>;

// Type for API key response
interface ApiKeyResponse {
  apiKey: string;
}

// Type for deletion response
interface DeleteApiKeyResponse {
  message: string;
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
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Compare password with hashed password
        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

        // If password is invalid, return error
        if (!isValidPassword) {
          const response: Response<ApiKeyResponse> = {
            success: false,
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
          success: true,
          data: {
            apiKey: newApiKey.key
          }
        };
        return reply.code(201).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Return validation errors
          const response: Response<ApiKeyResponse> = {
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

  // DELETE endpoint for API key deletion
  fastify.delete<{ Body: DeleteApiKeyRequest; Params: { id: string } }>(
    "/delete/:id",
    async function (request: FastifyRequest<{ Body: DeleteApiKeyRequest; Params: { id: string } }>, reply: FastifyReply) {
      try {
        const { id: apiKeyId } = request.params as { id: string };
        
        // Validate the request body against the schema
        const validatedData = deleteApiKeyRequestSchema.parse({
          ...(request.body as any),
          apiKeyId
        });

        // Find user by email
        const user = await prisma.user.findUnique({
          where: {
            email: validatedData.email
          }
        });

        // If user doesn't exist, return error
        if (!user) {
          const response: Response<DeleteApiKeyResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Compare password with hashed password
        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

        // If password is invalid, return error
        if (!isValidPassword) {
          const response: Response<DeleteApiKeyResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        // Check if the API key exists and belongs to the user
        const existingApiKey = await prisma.apiKey.findFirst({
          where: {
            id: apiKeyId,
            userId: user.id
          }
        });

        if (!existingApiKey) {
          const response: Response<DeleteApiKeyResponse> = {
            success: false,
            error: "API key not found or access denied"
          };
          return reply.code(404).send(response);
        }

        // Delete the API key
        await prisma.apiKey.delete({
          where: {
            id: apiKeyId
          }
        });

        // Return success response
        const response: Response<DeleteApiKeyResponse> = {
          success: true,
          data: {
            message: "API key deleted successfully"
          }
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Return validation errors
          const response: Response<DeleteApiKeyResponse> = {
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