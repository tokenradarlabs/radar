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
  getDetailedUsageAnalyticsRequestSchema,
  type GetDetailedUsageAnalyticsRequest,
  type UsageAnalyticsResponse,
} from '../../lib/api/getUsageAnalytics/getUsageAnalytics.schema';
import {
  GetUsageAnalyticsService,
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

  // POST endpoint for API key usage analytics
  fastify.post<{ Body: GetDetailedUsageAnalyticsRequest }>(
    '/usageAnalytics',
    { preHandler: [fastify.authenticate] }, // Apply authentication middleware
    async function (
      request: FastifyRequest<{ Body: GetDetailedUsageAnalyticsRequest }>,
      reply: FastifyReply
    ) {
      try {
        const validatedData = getDetailedUsageAnalyticsRequestSchema.parse(
          request.body
        );

        const userId = request.user?.id; // Assuming userId is available from authentication

        if (!userId) {
          const response: Response<UsageAnalyticsResponse> = {
            success: false,
            error: 'Unauthorized',
            code: ERROR_CODES.UNAUTHORIZED,
          };
          return reply.code(401).send(response);
        }

        const result =
          await GetUsageAnalyticsService.getUsageAnalytics(userId, validatedData);

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
