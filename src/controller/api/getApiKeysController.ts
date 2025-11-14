import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Response } from '../../types/responses';
import { sendInternalError, ERROR_CODES } from '../../utils/responseHelper';
import {
  getApiKeysRequestSchema,
  type GetApiKeysRequest,
  GetApiKeysService,
  type ApiKeyListResponse,
} from '../../lib/api/getApiKeys';
import {
  getUsageAnalyticsRequestSchema,
  type GetUsageAnalyticsRequest,
} from '../../lib/api/getUsageAnalytics/getUsageAnalytics.schema';
import {
  GetUsageAnalyticsService,
  type UsageAnalyticsResponse,
} from '../../lib/api/getUsageAnalytics/getUsageAnalytics.service';

export default async function getApiKeysController(fastify: FastifyInstance) {
  fastify.post<{ Body: GetApiKeysRequest }>(
    '/getApiKeys',
    async function (
      request: FastifyRequest<{ Body: GetApiKeysRequest }>,
      reply: FastifyReply
    ) {
      try {
        // Validate the request body against the schema
        const validatedData = getApiKeysRequestSchema.parse(request.body);

        const result = await GetApiKeysService.getApiKeys(validatedData);

        // Return the API keys
        const response: Response<ApiKeyListResponse> = {
          success: true,
          data: result,
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Return validation errors
          const response: Response<ApiKeyListResponse> = {
            success: false,
            error: error.errors[0].message,
            code: ERROR_CODES.VALIDATION_FAILED,
          };
          return reply.code(400).send(response);
        }

        if (error instanceof Error && error.message === 'Invalid credentials') {
          const response: Response<ApiKeyListResponse> = {
            success: false,
            error: error.message,
            code: ERROR_CODES.AUTHENTICATION_FAILED,
          };
          return reply.code(401).send(response);
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

  // GET endpoint for API key usage analytics
  fastify.post<{ Body: GetUsageAnalyticsRequest }>(
    '/usageAnalytics',
    async function (
      request: FastifyRequest<{ Body: GetUsageAnalyticsRequest }>,
      reply: FastifyReply
    ) {
      try {
        const validatedData = getUsageAnalyticsRequestSchema.parse(
          request.body
        );

        const result =
          await GetUsageAnalyticsService.getUsageAnalytics(validatedData);

        const response: Response<UsageAnalyticsResponse> = {
          success: true,
          data: result,
        };

        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response: Response<UsageAnalyticsResponse> = {
            success: false,
            error: error.errors[0].message,
            code: ERROR_CODES.VALIDATION_FAILED,
          };
          return reply.code(400).send(response);
        }

        if (error instanceof Error) {
          if (error.message === 'Invalid credentials') {
            const response: Response<UsageAnalyticsResponse> = {
              success: false,
              error: error.message,
              code: ERROR_CODES.AUTHENTICATION_FAILED,
            };
            return reply.code(401).send(response);
          }

          if (error.message === 'No API keys found') {
            const response: Response<UsageAnalyticsResponse> = {
              success: false,
              error: error.message,
              code: ERROR_CODES.API_KEY_NOT_FOUND,
            };
            return reply.code(404).send(response);
          }
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
