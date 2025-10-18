import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { z } from 'zod';
import { sendSuccess, sendBadRequest, sendInternalError } from '../utils/responseHelper';
import { formatValidationError } from '../utils/validation';
import {
  PriceService,
  priceTokenIdSchema,
  type TokenPriceParams,
} from '../lib/api/price';

export default async function priceController(fastify: FastifyInstance) {
  // GET /api/v1/price/:tokenId
  fastify.get<{ Params: TokenPriceParams }>(
    '/:tokenId',
    async function (
      request: FastifyRequest<{ Params: TokenPriceParams }>,
      reply: FastifyReply
    ) {
      try {
        // Validate token ID parameter
        const validatedParams = priceTokenIdSchema.parse(request.params);
        const { tokenId } = validatedParams;

        const responseData = await PriceService.getTokenPrice(tokenId);

        return sendSuccess(reply, responseData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendBadRequest(reply, formatValidationError(error));
        }

        logger.error({
          message: 'Price controller error',
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        return sendInternalError(reply, 'Failed to fetch token price');
      }
    }
  );
}
