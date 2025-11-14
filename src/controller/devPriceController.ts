import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import logger from '../utils/logger';
import {
  sendSuccess,
  sendBadRequest,
  sendInternalError,
} from '../utils/responseHelper';
import { DevPriceService } from '../lib/api/devPrice/devPrice.service';

export default async function devPriceController(fastify: FastifyInstance) {
  // GET /api/v1/dev/price
  fastify.get(
    '/',
    async function (_request: FastifyRequest, reply: FastifyReply) {
      try {
        const responseData = await DevPriceService.getDevTokenPrice();

        return sendSuccess(reply, responseData);
      } catch (error) {
        logger.error('DEV price controller error:', { error });
        if (error instanceof Error) {
          return sendBadRequest(reply, error.message, ERROR_CODES.BAD_REQUEST);
        } else {
          return sendInternalError(reply, 'Failed to fetch DEV token price', ERROR_CODES.INTERNAL_SERVER_ERROR);
        }      }
    }
  );
}
