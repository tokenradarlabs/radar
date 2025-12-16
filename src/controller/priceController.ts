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
import { PRICE_CACHE_MAX_AGE } from '../utils/config';
import {
  PriceService,
  priceTokenIdSchema,
  type TokenPriceParams,
} from '../lib/api/price';

/**
 * Registers the price API route with the Fastify instance.
 *
 * @param fastify The Fastify instance to register the route with.
 */
export default async function priceController(fastify: FastifyInstance) {
  // GET /api/v1/price/:tokenId
  fastify.get<{ Params: TokenPriceParams }>(
    '/:tokenId',
    /**
     * Handles requests for fetching token prices.
     *
     * @param request The Fastify request object, containing the tokenId in params.
     * @param reply The Fastify reply object used to send the response.
     */
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

        reply.header('Cache-Control', `public, max-age=${PRICE_CACHE_MAX_AGE}`);
        return sendSuccess(reply, responseData);
      } catch (error) {
        logger.error('Error in priceController', {
          message: error.message,
          stack: error.stack,
          tokenId: request.params.tokenId,
          ...(request.id && { requestId: request.id }),
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
