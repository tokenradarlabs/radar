import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getDevPrice, getBtcPrice, getEthPrice } from "../utils/uniswapPrice";
import {
  sendSuccess,
  sendNotFound,
  sendInternalError,
} from "../utils/responseHelper";

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
    "/:tokenId",
    async function (
      request: FastifyRequest<{ Params: TokenPriceParams }>,
      reply: FastifyReply
    ) {
      const { tokenId } = request.params;

      try {
        let price: number;

        switch (tokenId.toLowerCase()) {
          case "btc":
            price = await getBtcPrice();
            break;
          case "eth":
            price = await getEthPrice();
            break;
          case "scout-protocol-token":
            price = await getDevPrice();
            break;
          default:
            return sendNotFound(
              reply,
              "Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token"
            );
        }

        if (price === 0) {
          return sendInternalError(
            reply,
            "Failed to fetch token price from Uniswap"
          );
        }

        const responseData: TokenPriceData = {
          price,
          tokenId: tokenId.toLowerCase(),
        };

        return sendSuccess(reply, responseData);
      } catch (error) {
        console.error("Price controller error:", error);
        return sendInternalError(reply, "Failed to fetch token price");
      }
    }
  );
}
