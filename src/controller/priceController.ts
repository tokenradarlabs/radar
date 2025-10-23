import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { z } from 'zod';
import { sendSuccess } from '../utils/responseHelper';
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
        logger.error('Error in priceController', { error });
        throw error;
      }
    }
  );
}
