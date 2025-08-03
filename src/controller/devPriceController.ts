import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getDevPrice } from "../utils/uniswapPrice";
import {
  sendSuccess,
  sendNotFound,
  sendInternalError,
} from "../utils/responseHelper";

interface DevPriceData {
  price: number;
  token: string;
  symbol: string;
}

export default async function devPriceController(fastify: FastifyInstance) {
  // GET /api/v1/dev/price
  fastify.get(
    "/",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      try {
        const priceData = await getDevPrice();

        if (!priceData || priceData === 0) {
          return sendNotFound(reply, "DEV token price data not found");
        }

        const responseData: DevPriceData = {
          price: priceData,
          token: "scout-protocol-token",
          symbol: "DEV",
        };

        return sendSuccess(reply, responseData);
      } catch (error) {
        console.error("DEV price controller error:", error);
        return sendInternalError(reply, "Failed to fetch DEV token price");
      }
    }
  );
}
