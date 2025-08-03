import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { fetchTokenPriceChange } from "../utils/coinGeckoPriceChange";
import {
  sendSuccess,
  sendNotFound,
  sendInternalError,
} from "../utils/responseHelper";

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
    "/:tokenId",
    async function (
      request: FastifyRequest<{ Params: TokenPriceChangeParams }>,
      reply: FastifyReply
    ) {
      const { tokenId } = request.params;

      try {
        const priceChangeData = await fetchTokenPriceChange(tokenId);

        if (priceChangeData === null) {
          return sendNotFound(reply, "Token price change data not found");
        }

        const responseData: TokenPriceChangeData = {
          priceChange: priceChangeData,
          tokenId,
          period: "24h",
        };

        return sendSuccess(reply, responseData);
      } catch (error) {
        console.error("Price change controller error:", error);
        return sendInternalError(reply, "Failed to fetch token price change");
      }
    }
  );
}
