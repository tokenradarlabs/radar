import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getDevPrice, getBtcPrice, getEthPrice } from "../utils/uniswapPrice";

interface TokenPriceParams {
  tokenId: string;
}

export default async function priceController(fastify: FastifyInstance) {
  // GET /api/v1/price/:tokenId
  fastify.get<{ Params: TokenPriceParams }>(
    "/:tokenId",
    async function (request: FastifyRequest<{ Params: TokenPriceParams }>, reply: FastifyReply) {
      const { tokenId } = request.params;

      try {
        let price: number;

        switch (tokenId.toLowerCase()) {
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
            return reply.status(404).send({
              success: false,
              error: "Invalid token selection. Supported tokens are: btc, eth, scout-protocol-token"
            });
        }

        if (price === 0) {
          return reply.status(500).send({
            success: false,
            error: "Failed to fetch token price from Uniswap"
          });
        }

        return reply.send({
          success: true,
          price: price
        });
      } catch (error) {
        console.error("Price controller error:", error);
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch token price"
        });
      }
    }
  );
} 