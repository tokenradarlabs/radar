import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';
import { z } from 'zod';
import { sendSuccess, sendBadRequest } from '../utils/responseHelper';
import { formatValidationError } from '../utils/validation';
import { VolumeService } from '../lib/api/volume/volume.service';
import {
  volumeTokenIdSchema,
  type TokenVolumeParams,
} from '../lib/api/volume/volume.schema';

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

        const responseData = await VolumeService.getTokenVolume(tokenId);

        return sendSuccess(reply, responseData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendBadRequest(reply, formatValidationError(error));
        }

        logger.error('Volume controller error:', { error });
        return sendBadRequest(
          reply,
          error instanceof Error
            ? error.message
            : 'Failed to fetch token volume'
        );
      }
    }
  );
}
