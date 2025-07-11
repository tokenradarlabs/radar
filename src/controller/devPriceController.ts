import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fetchTokenPrice } from "../utils/coinGeckoPrice";

const DEV_TOKEN_ID = 'scout-protocol-token'; // CoinGecko ID for DEV token

export default async function devPriceController(fastify: FastifyInstance) {
  // GET /api/v1/dev/price
  fastify.get(
    "/",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      try {
        const priceData = await fetchTokenPrice(DEV_TOKEN_ID);
        
        if (!priceData) {
          return reply.status(404).send({
            success: false,
            error: "404 DEV token price data not found"
          });
        }

        return reply.send({
          price: priceData.usd,
          token: DEV_TOKEN_ID
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch DEV token price"
        });
      }
    }
  );
} 