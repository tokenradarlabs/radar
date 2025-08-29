import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { priceAlertSchema } from '../../lib/api/priceAlert/priceAlert.schema';
import { PriceAlertService } from '../../lib/api/priceAlert/priceAlert.service';
import { sendSuccess, sendBadRequest, sendUnauthorized } from '../../utils/responseHelper';
import logger from '../../utils/logger';
import jwt from 'jsonwebtoken';
import { getValidatedEnv } from '../../utils/envValidation';

export default async function priceAlertController(fastify: FastifyInstance) {
  fastify.post('/api/v1/price-alert', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Auth check: require valid API key and JWT
      const apiKey = request.headers['x-api-key'];
      const authHeader = request.headers['authorization'];
      if (!apiKey || !authHeader) {
        logger.warn('Unauthorized price alert creation attempt', { apiKey, authHeader });
        return sendUnauthorized(reply, 'Valid API key and JWT required');
      }
      const token = authHeader.split(' ')[1];
      const { JWT_SECRET } = getValidatedEnv();
      let user;
      try {
        user = jwt.verify(token, JWT_SECRET) as { id: string };
      } catch (err) {
        logger.warn('JWT verification failed', { err });
        return sendUnauthorized(reply, 'Invalid or expired JWT');
      }
  // Validate body
  const params = priceAlertSchema.parse(request.body);
  const result = await PriceAlertService.createAlert(params, user.id);
  logger.info('Price alert created', { userId: user.id, ...params });
  return sendSuccess(reply, result);
    } catch (error) {
      logger.error('Error creating price alert', { error });
      if (error instanceof Error) {
        return sendBadRequest(reply, error.message);
      }
      return sendBadRequest(reply, 'Invalid request');
    }
  });
}
