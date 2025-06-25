import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { fetchTokenPriceChange } from "../utils/coinGeckoPriceChange";

interface TokenPriceChangeParams {
  tokenId: string;
}

export default async function priceChangeController(fastify: FastifyInstance) {
  // GET /api/v1/priceChange/:tokenId
  fastify.get<{ Params: TokenPriceChangeParams }>(
    "/:tokenId",
    async function (request: FastifyRequest<{ Params: TokenPriceChangeParams }>, reply: FastifyReply) {
      const { tokenId } = request.params;

      try {
        const priceChangeData = await fetchTokenPriceChange(tokenId);
        
        if (!priceChangeData) {
          return reply.status(404).send({
            success: false,
            error: "404 Token price change data not found"
          });
        }

        return reply.send({
          success: true,
          priceChange: priceChangeData
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch token price change"
        });
      }
    }
  );
} 