import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { fetchTokenVolume } from "../utils/coinGeckoVolume";
import {
  sendSuccess,
  sendNotFound,
  sendInternalError,
} from "../utils/responseHelper";

interface TokenVolumeParams {
  tokenId: string;
}

interface TokenVolumeData {
  volume: number;
  tokenId: string;
  period: string;
}

export default async function volumeController(fastify: FastifyInstance) {
  // GET /api/v1/volume/:tokenId
  fastify.get<{ Params: TokenVolumeParams }>(
    "/:tokenId",
    async function (
      request: FastifyRequest<{ Params: TokenVolumeParams }>,
      reply: FastifyReply
    ) {
      const { tokenId } = request.params;

      try {
        const volumeData = await fetchTokenVolume(tokenId);

        if (!volumeData) {
          return sendNotFound(reply, "Token volume data not found");
        }

        const responseData: TokenVolumeData = {
          volume: volumeData.usd_24h_vol,
          tokenId,
          period: "24h",
        };

        return sendSuccess(reply, responseData);
      } catch (error) {
        console.error("Volume controller error:", error);
        return sendInternalError(reply, "Failed to fetch token volume");
      }
    }
  );
}
