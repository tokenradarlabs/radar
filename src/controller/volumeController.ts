import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { fetchTokenVolume } from '../utils/coinGeckoVolume';
import {
  sendSuccess,
  sendNotFound,
  sendInternalError,
  sendBadRequest,
} from '../utils/responseHelper';
import {
  volumeTokenIdSchema,
  formatValidationError,
} from '../utils/validation';

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
    '/:tokenId',
    async function (
      request: FastifyRequest<{ Params: TokenVolumeParams }>,
      reply: FastifyReply
    ) {
      try {
        // Validate token ID parameter
        const validatedParams = volumeTokenIdSchema.parse(request.params);
        const { tokenId } = validatedParams;

        const volumeData = await fetchTokenVolume(tokenId);

        if (!volumeData) {
          return sendNotFound(reply, 'Token volume data not found');
        }

        const responseData: TokenVolumeData = {
          volume: volumeData.usd_24h_vol,
          tokenId,
          period: '24h',
        };

        return sendSuccess(reply, responseData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendBadRequest(reply, formatValidationError(error));
        }

        console.error('Volume controller error:', error);
        return sendInternalError(reply, 'Failed to fetch token volume');
      }
    }
  );
}
