import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDevPrice, getBtcPrice, getEthPrice } from '../utils/uniswapPrice';
import {
  sendSuccess,
  sendNotFound,
  sendInternalError,
  sendBadRequest,
} from '../utils/responseHelper';
import { priceTokenIdSchema, formatValidationError } from '../utils/validation';

interface TokenPriceParams {
  tokenId: string;
}

interface TokenPriceData {
  price: number;
  tokenId: string;
}

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

        let price: number;

        switch (tokenId) {
          case 'btc':
            price = await getBtcPrice();
            break;
          case 'eth':
            price = await getEthPrice();
            break;
          case 'scout-protocol-token':
            price = await getDevPrice();
            break;
          default:
            return sendNotFound(
              reply,
              'Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token'
            );
        }

        if (price === 0) {
          return sendInternalError(
            reply,
            'Failed to fetch token price from Uniswap'
          );
        }

        const responseData: TokenPriceData = {
          price,
          tokenId,
        };

        return sendSuccess(reply, responseData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendBadRequest(reply, formatValidationError(error));
        }

        console.error('Price controller error:', error);
        return sendInternalError(reply, 'Failed to fetch token price');
      }
    }
  );
}
