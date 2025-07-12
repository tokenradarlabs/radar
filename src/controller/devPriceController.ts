import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getDevPrice } from "../utils/uniswapPrice";


export default async function devPriceController(fastify: FastifyInstance) {
  // GET /api/v1/dev/price
  fastify.get(
    "/",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      try {
        const priceData = await getDevPrice();
        
        if (!priceData) {
          return reply.status(404).send({
            success: false,
            error: "404 DEV token price data not found"
          });
        }

        return reply.send({
          price: priceData,
          token: "scout-protocol-token"
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