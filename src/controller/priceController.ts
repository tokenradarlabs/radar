import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { z } from 'zod';
import {
  sendSuccess,
  sendBadRequest,
  sendInternalError,
} from '../utils/responseHelper';
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
      logger.info('Fetching token price', { tokenId: request.params.tokenId });
      try {
        // Validate token ID parameter
        const validatedParams = priceTokenIdSchema.parse(request.params);
        const { tokenId } = validatedParams;

        const responseData = await PriceService.getTokenPrice(tokenId);

        return sendSuccess(reply, responseData);
      } catch (error) {
        logger.error('Error in priceController', {
          message: error.message,
          stack: error.stack,
          tokenId: request.params.tokenId,
        });
        if (error instanceof z.ZodError) {
          return sendBadRequest(reply, formatValidationError(error));
        } else if (error instanceof Error) {
          return sendBadRequest(reply, error.message);
        } else {
          return sendInternalError(reply, 'An unexpected error occurred');
        }
      }
    }
  );
}
