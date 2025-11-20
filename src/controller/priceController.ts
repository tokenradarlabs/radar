import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { z } from 'zod';
import {
  sendSuccess,
  sendBadRequest,
  sendInternalError,
  ERROR_CODES,
} from '../utils/responseHelper';
import { formatZodError } from '../utils/validation';
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

        reply.header('Cache-Control', 'public, max-age=60');
        return sendSuccess(reply, responseData);
      } catch (error) {
        logger.error('Error in priceController', {
          message: error.message,
          stack: error.stack,
          tokenId: request.params.tokenId,
        });
        if (error instanceof z.ZodError) {
          return sendBadRequest(
            reply,
            formatZodError(error)
              .map((err) => err.message)
              .join(', '),
            ERROR_CODES.VALIDATION_FAILED
          );
        } else if (error instanceof Error) {
          return sendBadRequest(reply, error.message, ERROR_CODES.BAD_REQUEST);
        } else {
          return sendInternalError(
            reply,
            'An unexpected error occurred',
            ERROR_CODES.INTERNAL_SERVER_ERROR
          );
        }
      }
    }
  );
}
