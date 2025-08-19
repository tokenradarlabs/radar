import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../utils/prisma";
import { Response } from "../../types/responses";
import { handleControllerError } from "../../utils/responseHelper";
import { 
  deleteApiKeyRequestSchema,
  type DeleteApiKeyRequest
} from "../../lib/api/deleteApiKey/deleteApiKey.schema";
import { 
  updateApiKeyRequestSchema,
  type UpdateApiKeyRequest
} from "../../lib/api/updateApiKey/updateApiKey.schema";
import { apiKeyGenerateSchema,
  type ApiKeyRequest
} from "../../lib/api/generateApi/generateApiKey.schema";


interface ApiKeyResponse {
  apiKey: string;
}

interface DeleteApiKeyResponse {
  message: string;
}

interface UpdateApiKeyResponse {
  message: string;
  apiKey: {
    id: string;
    name: string;
    updatedAt: Date;
  };
}

function generateApiKey(): string {
  return `rdr_${crypto.randomBytes(32).toString('hex')}`;
}

function generateKeyName(): string {
  return `API Key - ${new Date().toISOString()}`;
}
export default async function apiKeyController(fastify: FastifyInstance) {
  fastify.post<{ Body: ApiKeyRequest }>(
    "/generate",
    async function (request: FastifyRequest<{ Body: ApiKeyRequest }>, reply: FastifyReply) {
      try {
        const validatedData = apiKeyGenerateSchema.parse(request.body);

        const user = await prisma.user.findUnique({
          where: {
            email: validatedData.email
          }
        });

        if (!user) {
          const response: Response<ApiKeyResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

        if (!isValidPassword) {
          const response: Response<ApiKeyResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        const apiKey = generateApiKey();
        const newApiKey = await prisma.apiKey.create({
          data: {
            key: apiKey,
            name: generateKeyName(),
            userId: user.id
          }
        });

        const response: Response<ApiKeyResponse> = {
          success: true,
          data: {
            apiKey: newApiKey.key
          }
        };
        return reply.code(201).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
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
        
        const validatedData = deleteApiKeyRequestSchema.parse({
          ...(request.body as any),
          apiKeyId
        });

        const user = await prisma.user.findUnique({
          where: {
            email: validatedData.email
          }
        });

        if (!user) {
          const response: Response<DeleteApiKeyResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

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

        await prisma.apiKey.delete({
          where: {
            id: apiKeyId
          }
        });

        const response: Response<DeleteApiKeyResponse> = {
          success: true,
          data: {
            message: "API key deleted successfully"
          }
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
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

  // PUT endpoint for API key update/rename
  fastify.put<{ Body: UpdateApiKeyRequest; Params: { id: string } }>(
    "/update/:id",
    async function (request: FastifyRequest<{ Body: UpdateApiKeyRequest; Params: { id: string } }>, reply: FastifyReply) {
      try {
        const { id: apiKeyId } = request.params as { id: string };
        
        const validatedData = updateApiKeyRequestSchema.parse(request.body);

        const user = await prisma.user.findUnique({
          where: {
            email: validatedData.email
          }
        });

        if (!user) {
          const response: Response<UpdateApiKeyResponse> = {
            success: false,
            error: "Invalid credentials"
          };
          return reply.code(401).send(response);
        }

        const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

        if (!isValidPassword) {
          const response: Response<UpdateApiKeyResponse> = {
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
          const response: Response<UpdateApiKeyResponse> = {
            success: false,
            error: "API key not found or access denied"
          };
          return reply.code(404).send(response);
        }

        const updatedApiKey = await prisma.apiKey.update({
          where: {
            id: apiKeyId
          },
          data: {
            name: validatedData.name
          }
        });

        const response: Response<UpdateApiKeyResponse> = {
          success: true,
          data: {
            message: "API key updated successfully",
            apiKey: {
              id: updatedApiKey.id,
              name: updatedApiKey.name,
              updatedAt: updatedApiKey.updatedAt
            }
          }
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response: Response<UpdateApiKeyResponse> = {
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