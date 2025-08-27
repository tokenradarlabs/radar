import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import logger from '../utils/logger';
import {
  sendSuccess,
  sendBadRequest,
} from "../utils/responseHelper";
import { DevPriceService } from '../lib/api/devPrice/devPrice.service';

export default async function devPriceController(fastify: FastifyInstance) {
  // GET /api/v1/dev/price
  fastify.get(
    "/",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      try {
        const responseData = await DevPriceService.getDevTokenPrice();

        return sendSuccess(reply, responseData);
      } catch (error) {
  logger.error('DEV price controller error:', { error });
        return sendBadRequest(reply, error instanceof Error ? error.message : "Failed to fetch DEV token price");
      }
    }
  );
}
