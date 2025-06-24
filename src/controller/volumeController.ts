import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { fetchTokenVolume } from "../utils/coinGeckoVolume";

interface TokenVolumeParams {
  tokenId: string;
}

export default async function volumeController(fastify: FastifyInstance) {
  // GET /api/v1/volume/:tokenId
  fastify.get<{ Params: TokenVolumeParams }>(
    "/:tokenId",
    async function (request: FastifyRequest<{ Params: TokenVolumeParams }>, reply: FastifyReply) {
      const { tokenId } = request.params;

      try {
        const volumeData = await fetchTokenVolume(tokenId);
        
        if (!volumeData) {
          return reply.status(404).send({
            success: false,
            error: "404 Token volume data not found"
          });
        }

        return reply.send({
          success: true,
          volume: volumeData.usd_24h_vol
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: "Failed to fetch token volume"
        });
      }
    }
  );
} 