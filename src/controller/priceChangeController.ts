import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  sendSuccess,
  sendBadRequest,
} from '../utils/responseHelper';
import {
  formatValidationError,
} from '../utils/validation';
import { 
  PriceChangeService, 
  priceChangeTokenIdSchema, 
  type TokenPriceChangeParams
} from '../lib/api/priceChange';

export default async function priceChangeController(fastify: FastifyInstance) {
  // GET /api/v1/priceChange/:tokenId
  fastify.get<{ Params: TokenPriceChangeParams }>(
    '/:tokenId',
    async function (
      request: FastifyRequest<{ Params: TokenPriceChangeParams }>,
      reply: FastifyReply
    ) {
      try {
        // Validate token ID parameter
        const validatedParams = priceChangeTokenIdSchema.parse(request.params);
        const { tokenId } = validatedParams;

        const responseData = await PriceChangeService.getTokenPriceChange(tokenId);

        return sendSuccess(reply, responseData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendBadRequest(reply, formatValidationError(error));
        }

        console.error('Price change controller error:', error);
        return sendBadRequest(reply, error instanceof Error ? error.message : 'Failed to fetch token price change');
      }
    }
  );
}
