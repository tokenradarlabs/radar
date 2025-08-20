import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
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
import { GenerateApiKeyService, type ApiKeyResponse } from "../../lib/api/generateApi/generateApiKey.service";
import { DeleteApiKeyService, type DeleteApiKeyResponse } from "../../lib/api/deleteApiKey/deleteApiKey.service";
import { UpdateApiKeyService, type UpdateApiKeyResponse } from "../../lib/api/updateApiKey/updateApiKey.service";
export default async function apiKeyController(fastify: FastifyInstance) {
  fastify.post<{ Body: ApiKeyRequest }>(
    "/generate",
    async function (request: FastifyRequest<{ Body: ApiKeyRequest }>, reply: FastifyReply) {
      try {
        const validatedData = apiKeyGenerateSchema.parse(request.body);
        const result = await GenerateApiKeyService.generateApiKey(validatedData);

        const response: Response<ApiKeyResponse> = {
          success: true,
          data: result
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
        
        if (error instanceof Error && error.message === "Invalid credentials") {
          const response: Response<ApiKeyResponse> = {
            success: false,
            error: error.message
          };
          return reply.code(401).send(response);
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

        const result = await DeleteApiKeyService.deleteApiKey(validatedData);

        const response: Response<DeleteApiKeyResponse> = {
          success: true,
          data: result
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

        if (error instanceof Error) {
          if (error.message === "Invalid credentials") {
            const response: Response<DeleteApiKeyResponse> = {
              success: false,
              error: error.message
            };
            return reply.code(401).send(response);
          }
          
          if (error.message === "API key not found or access denied") {
            const response: Response<DeleteApiKeyResponse> = {
              success: false,
              error: error.message
            };
            return reply.code(404).send(response);
          }
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

        const result = await UpdateApiKeyService.updateApiKey(validatedData, apiKeyId);

        const response: Response<UpdateApiKeyResponse> = {
          success: true,
          data: result
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

        if (error instanceof Error) {
          if (error.message === "Invalid credentials") {
            const response: Response<UpdateApiKeyResponse> = {
              success: false,
              error: error.message
            };
            return reply.code(401).send(response);
          }
          
          if (error.message === "API key not found or access denied") {
            const response: Response<UpdateApiKeyResponse> = {
              success: false,
              error: error.message
            };
            return reply.code(404).send(response);
          }
        }

        handleControllerError(reply, error, "Internal server error");
        return;
      }
    }
  );
}