import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { fetchTokenPriceChange } from '../utils/coinGeckoPriceChange';
import {
  sendSuccess,
  sendNotFound,
  sendInternalError,
  sendBadRequest,
} from '../utils/responseHelper';
import {
  volumeTokenIdSchema,
  formatValidationError,
} from '../utils/validation';

interface TokenPriceChangeParams {
  tokenId: string;
}

interface TokenPriceChangeData {
  priceChange: number;
  tokenId: string;
  period: string;
}

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
        const validatedParams = volumeTokenIdSchema.parse(request.params);
        const { tokenId } = validatedParams;

        const priceChangeData = await fetchTokenPriceChange(tokenId);

        if (priceChangeData === null) {
          return sendNotFound(reply, 'Token price change data not found');
        }

        const responseData: TokenPriceChangeData = {
          priceChange: priceChangeData,
          tokenId,
          period: '24h',
        };

        return sendSuccess(reply, responseData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendBadRequest(reply, formatValidationError(error));
        }

        console.error('Price change controller error:', error);
        return sendInternalError(reply, 'Failed to fetch token price change');
      }
    }
  );
}
