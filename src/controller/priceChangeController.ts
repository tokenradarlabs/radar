import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { z } from 'zod';
import { sendSuccess, sendBadRequest, ERROR_CODES } from '../utils/responseHelper';
import { formatZodError } from '../utils/validation';
import { telemetry } from '../utils/telemetry';
import {
  PriceChangeService,
  priceChangeTokenIdSchema,
  type TokenPriceChangeParams,
} from '../lib/api/priceChange';

export default async function priceChangeController(fastify: FastifyInstance) {
  // GET /api/v1/priceChange/:tokenId
  fastify.get<{ Params: TokenPriceChangeParams }>(
    '/:tokenId',
    async function (
      request: FastifyRequest<{ Params: TokenPriceChangeParams }>,
      reply: FastifyReply
    ) {
      const startTime = process.hrtime.bigint();
      try {
        // Validate token ID parameter
        const validatedParams = priceChangeTokenIdSchema.parse(request.params);
        const { tokenId } = validatedParams;

        const responseData =
          await PriceChangeService.getTokenPriceChange(tokenId);

        telemetry.recordCount('price_change_request', 1, { tokenId });
        return sendSuccess(reply, responseData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendBadRequest(
            reply,
            formatZodError(error).map((err) => err.message).join(', '),
            ERROR_CODES.VALIDATION_FAILED
          );

        logger.error('Price change controller error:', { error });
        return sendBadRequest(
          reply,
          error instanceof Error
            ? error.message
            : 'Failed to fetch token price change',
          ERROR_CODES.INTERNAL_SERVER_ERROR
        );
      } finally {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;
        telemetry.recordDuration(
          'price_change_controller_duration',
          durationMs,
          { method: request.method, url: request.url }
        );
      }
    }
  );
}
