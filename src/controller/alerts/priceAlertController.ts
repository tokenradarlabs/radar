import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { priceAlertSchema } from '../../lib/api/priceAlert/priceAlert.schema';
import { PriceAlertService } from '../../lib/api/priceAlert/priceAlert.service';
import { ZodError } from 'zod';
import {
  sendSuccess,
  sendBadRequest,
  sendUnauthorized,
} from '../../utils/responseHelper';
import logger from '../../utils/logger';
import jwt from 'jsonwebtoken';
import { validateEnvironmentVariables } from '../../utils/envValidation';

export default async function priceAlertController(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/price-alert',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // Auth check: require valid API key and JWT
        const apiKey = request.headers['x-api-key'];
        const authHeader = request.headers['authorization'];
        if (!apiKey || !authHeader) {
          logger.warn('Unauthorized price alert creation attempt', {
            apiKey,
            authHeader,
          });
          return sendUnauthorized(reply, 'Valid API key and JWT required', ERROR_CODES.AUTHENTICATION_FAILED);
        }
        const token = authHeader.split(' ')[1];
        const { JWT_SECRET } = validateEnvironmentVariables();
        let user;
        try {
          user = jwt.verify(token, JWT_SECRET) as { id: string };
        } catch (err) {
          logger.warn('JWT verification failed', { err });
          return sendUnauthorized(reply, 'Invalid or expired JWT', ERROR_CODES.SESSION_EXPIRED);
        }
        // Validate body
        const params = priceAlertSchema.parse({ ...request.body, userId: user.id });
        const result = await PriceAlertService.createAlert(params, user.id);
        logger.info('Price alert created', { userId: user.id, ...params });
        return sendSuccess(reply, result);
      } catch (error) {
        logger.error('Error creating price alert', { error });
        if (error instanceof ZodError) {
          return sendBadRequest(reply, 'Validation Error: ' + error.errors.map(e => e.message).join(', '), ERROR_CODES.VALIDATION_FAILED);
        }
        if (error instanceof Error) {
          return sendBadRequest(reply, error.message, ERROR_CODES.BAD_REQUEST);
        }
        return sendBadRequest(reply, 'Invalid request', ERROR_CODES.BAD_REQUEST);
      }    }
  );
}
