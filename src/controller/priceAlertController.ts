import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { priceAlertSchema } from '../lib/api/priceAlert/priceAlert.schema';
import { PriceAlertService } from '../lib/api/priceAlert/priceAlert.service';
import { sendSuccess, sendBadRequest, sendUnauthorized } from '../utils/responseHelper';
import logger from '../utils/logger';

export default async function priceAlertController(fastify: FastifyInstance) {
  fastify.post('/api/v1/price-alert', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Auth check (only require valid API key)
      const apiKey = request.headers['x-api-key'];
      if (!apiKey) {
        logger.warn('Unauthorized price alert creation attempt', { apiKey });
        return sendUnauthorized(reply, 'Valid API key required');
      }
      // Validate body
      const params = priceAlertSchema.parse(request.body);
  const result = PriceAlertService.createAlert(params);
  logger.info('Price alert created', { ...params });
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
