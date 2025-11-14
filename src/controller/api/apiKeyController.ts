import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Response } from '../../types/responses';
import { sendInternalError, ERROR_CODES } from '../../utils/responseHelper';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../utils/errors';
import {
  deleteApiKeyCombinedSchema,
  type DeleteApiKeyRequest,
  type DeleteApiKeyParams,
  DeleteApiKeyService,
  type DeleteApiKeyResponse,
} from '../../lib/api/deleteApiKey';
import {
  updateApiKeyCombinedSchema,
  type UpdateApiKeyRequest,
  type UpdateApiKeyParams,
  UpdateApiKeyService,
  type UpdateApiKeyResponse,
} from '../../lib/api/updateApiKey';
import {
  apiKeyGenerateSchema,
  type ApiKeyRequest,
  GenerateApiKeyService,
  type ApiKeyResponse,
} from '../../lib/api/generateApi';
export default async function apiKeyController(fastify: FastifyInstance) {
  fastify.post<{ Body: ApiKeyRequest }>(
    '/generate',
    async function (
      request: FastifyRequest<{ Body: ApiKeyRequest }>,
      reply: FastifyReply
    ) {
      try {
        const validatedData = apiKeyGenerateSchema.parse(request.body);
        const result =
          await GenerateApiKeyService.generateApiKey(validatedData);

        const response: Response<ApiKeyResponse> = {
          success: true,
          data: result,
        };
        return reply.code(201).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response: Response<ApiKeyResponse> = {
            success: false,
            error: error.errors[0].message,
            code: ERROR_CODES.VALIDATION_FAILED,
          };
          return reply.code(400).send(response);
        }

        if (error instanceof UnauthorizedError) {
          const response: Response<ApiKeyResponse> = {
            success: false,
            error: error.message,
            code: ERROR_CODES.UNAUTHORIZED,
          };
          return reply.code(401).send(response);
        }

        if (error instanceof ConflictError) {
          const response: Response<ApiKeyResponse> = {
            success: false,
            error: error.message,
            code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
          };
          return reply.code(409).send(response);
        }

        sendInternalError(
          reply,
          'Internal server error',
          ERROR_CODES.INTERNAL_SERVER_ERROR
        );
        return;
      }
    }
  );

  // DELETE endpoint for API key deletion
  fastify.delete<{ Body: DeleteApiKeyRequest; Params: DeleteApiKeyParams }>(
    '/delete/:id',
    async function (
      request: FastifyRequest<{
        Body: DeleteApiKeyRequest;
        Params: DeleteApiKeyParams;
      }>,
      reply: FastifyReply
    ) {
      try {
        const validatedData = deleteApiKeyCombinedSchema.parse({
          ...request.body,
          apiKeyId: request.params.id,
        });

        const result = await DeleteApiKeyService.deleteApiKey(validatedData);

        const response: Response<DeleteApiKeyResponse> = {
          success: true,
          data: result,
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response: Response<DeleteApiKeyResponse> = {
            success: false,
            error: error.errors[0].message,
            code: ERROR_CODES.VALIDATION_FAILED,
          };
          return reply.code(400).send(response);
        }

        if (error instanceof UnauthorizedError) {
          const response: Response<DeleteApiKeyResponse> = {
            success: false,
            error: error.message,
            code: ERROR_CODES.UNAUTHORIZED,
          };
          return reply.code(401).send(response);
        }

        if (error instanceof NotFoundError) {
          const response: Response<DeleteApiKeyResponse> = {
            success: false,
            error: error.message,
            code: ERROR_CODES.API_KEY_NOT_FOUND,
          };
          return reply.code(404).send(response);
        }

        sendInternalError(
          reply,
          'Internal server error',
          ERROR_CODES.INTERNAL_SERVER_ERROR
        );
        return;
      }
    }
  );

  // PUT endpoint for API key update/rename
  fastify.put<{ Body: UpdateApiKeyRequest; Params: UpdateApiKeyParams }>(
    '/update/:id',
    async function (
      request: FastifyRequest<{
        Body: UpdateApiKeyRequest;
        Params: UpdateApiKeyParams;
      }>,
      reply: FastifyReply
    ) {
      try {
        const validatedData = updateApiKeyCombinedSchema.parse({
          ...request.body,
          apiKeyId: request.params.id,
        });

        const result = await UpdateApiKeyService.updateApiKey(
          validatedData,
          validatedData.apiKeyId
        );

        const response: Response<UpdateApiKeyResponse> = {
          success: true,
          data: result,
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response: Response<UpdateApiKeyResponse> = {
            success: false,
            error: error.errors[0].message,
            code: ERROR_CODES.VALIDATION_FAILED,
          };
          return reply.code(400).send(response);
        }

        if (error instanceof UnauthorizedError) {
          const response: Response<UpdateApiKeyResponse> = {
            success: false,
            error: error.message,
            code: ERROR_CODES.UNAUTHORIZED,
          };
          return reply.code(401).send(response);
        }

        if (error instanceof NotFoundError) {
          const response: Response<UpdateApiKeyResponse> = {
            success: false,
            error: error.message,
            code: ERROR_CODES.API_KEY_NOT_FOUND,
          };
          return reply.code(404).send(response);
        }

        if (error instanceof ConflictError) {
          const response: Response<UpdateApiKeyResponse> = {
            success: false,
            error: error.message,
            code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
          };
          return reply.code(409).send(response);
        }

        sendInternalError(
          reply,
          'Internal server error',
          ERROR_CODES.INTERNAL_SERVER_ERROR
        );
        return;
      }
    }
  );
}
