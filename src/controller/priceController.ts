import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { fetchTokenPrice } from "../utils/coinGeckoPrice";

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
        const priceData = await fetchTokenPrice(tokenId);
        
        if (!priceData) {
          return reply.status(404).send({
            success: false,
            error: "404 Token price data not found"
          });
        }

        return reply.send({
          success: true,
          price: priceData.usd
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch token price"
        });
      }
    }
  );
} 