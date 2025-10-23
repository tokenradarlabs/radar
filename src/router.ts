import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {
  loginController,
  registerController,
  profileController,
} from './controller/auth';
import { apiKeyController, getApiKeysController } from './controller/api';
import userController from './controller/userController';
import indexController from './controller/indexController';
import priceController from './controller/priceController';
import priceChangeController from './controller/priceChangeController';
import volumeController from './controller/volumeController';
import devPriceController from './controller/devPriceController';
import priceAlertController from './controller/alerts/priceAlertController';
import { authenticateApiKey } from './utils/auth';

const createRateLimitOptions = (
  max: number,
  timeWindow: string,
  keyGenerator?: (request: any) => string
) => ({
  max,
  timeWindow,
  errorResponseBuilder: function (_req: any, context: any) {
    return {
      success: false,
      error: `Rate limit exceeded, retry in ${context.after}`,
    };
  },
  keyGenerator,
});

export default async function router(fastify: FastifyInstance) {
  // Auth endpoints with rate limiting
  fastify.register(
    async (fastify) => {
      // Enable rate limiting for all auth routes
      await fastify.register(rateLimit, createRateLimitOptions(5, '1 minute'));
      await fastify.register(rateLimit, {
        max: 5,
        timeWindow: '1 minute',
        errorResponseBuilder: function (_req, context) {
          return {
            success: false,
            error: `Rate limit exceeded, retry in ${context.after}`,
          };
        },
      });

      fastify.register(loginController);
      fastify.register(registerController);
      fastify.register(profileController);
    },
    { prefix: '/auth' }
  );

  // API key management endpoints with rate limiting
  fastify.register(
    async (fastify) => {
      await fastify.register(rateLimit, createRateLimitOptions(5, '1 minute'));
      await fastify.register(rateLimit, {
        max: 5,
        timeWindow: '1 minute',
        errorResponseBuilder: function (_req, context) {
          return {
            success: false,
            error: `Rate limit exceeded, retry in ${context.after}`,
          };
        },
      });

      fastify.register(apiKeyController);
      fastify.register(getApiKeysController);
    },
    { prefix: '/api/v1/keys' }
  );

  fastify.register(userController, { prefix: '/user' });

  // API endpoints - require API key authentication
  fastify.register(async (fastify) => {
    // Apply API key authentication middleware to all routes in this context
    fastify.addHook('preHandler', authenticateApiKey);

    // Enable rate limiting for authenticated API routes based on API key
    await fastify.register(
      rateLimit,
      createRateLimitOptions(20, '1 minute', function (request: any) {
        // Use API key from x-api-key header for rate limiting
        const apiKey = request.headers['x-api-key'] as string;
        return apiKey ? `auth_api_key:${apiKey}` : request.ip;
      })
    );
    await fastify.register(rateLimit, {
      max: 20,
      timeWindow: '1 minute',
      keyGenerator: function (request) {
        // Use API key from x-api-key header for rate limiting
        const apiKey = request.headers['x-api-key'] as string;
        return apiKey ? `auth_api_key:${apiKey}` : request.ip;
      },
      errorResponseBuilder: function (_req, context) {
        return {
          success: false,
          error: `Rate limit exceeded, retry in ${context.after}`,
        };
      },
    });

    fastify.register(priceController, { prefix: '/api/v1/price' });
    fastify.register(priceChangeController, { prefix: '/api/v1/priceChange' });
    fastify.register(volumeController, { prefix: '/api/v1/volume' });
    fastify.register(devPriceController, { prefix: '/api/v1/price/dev' });
    fastify.register(priceAlertController);
  });

  // Public endpoints (no authentication required)
  fastify.addHook('preHandler', (request, reply, done) => {
    if (request.url === '//') {
      reply.redirect('/');
      return done();
    } else if (request.url === '') {
      reply.redirect('/');
      return done();
    }
    done();
  });
  fastify.register(indexController, { prefix: '/' });
}
