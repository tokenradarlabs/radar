import 'dotenv/config';
import fastify, {
  FastifyError,
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyRegisterOptions,
  RawServerDefault,
  FastifyTypeProvider,
  FastifyBaseLogger,
} from 'fastify';
import rateLimiterPlugin from './utils/rateLimiter';
import requestTimingPlugin from './plugins/requestTiming';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { corsConfig } from './utils/config';
import router from './router';
import { z } from 'zod';
import { isDatabaseUnavailableError } from './utils/db';
import { sendServiceUnavailable, errorResponse } from './utils/responseHelper';
import logger, { asyncLocalStorage } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { connectPrisma, disconnectPrisma } from './utils/prisma';
import { getDetailedHealth } from './utils/healthCheck';

const APP_VERSION = '4.1.0';

export async function buildApp(): Promise<FastifyInstance> {
  const server = fastify({
    // Logger only for production
    logger: !!(process.env.NODE_ENV !== 'development'),
    // Set request size limits for security
    bodyLimit: 1048576, // 1MB limit for request body
  });

  // Connect to the database at startup
  await connectPrisma();

  // Maintenance mode check
  if (process.env.MAINTENANCE_MODE === 'true') {
    server.addHook('onRequest', (request, reply, done) => {
      reply.status(503).send({ message: 'Service Unavailable' });
    });
  }

  // Register security headers plugin (Helmet)
  server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // Register CORS plugin
  server.register(cors, corsConfig);

  // Register rate limiter plugin
  server.register(rateLimiterPlugin);

  // Register request timing plugin
  server.register(requestTimingPlugin);

  // Request-scoped context middleware
  server.addHook('onRequest', (request, reply, done) => {
    const store = new Map();
    const requestIdHeader = request.headers['x-request-id'];
    const requestId =
      typeof requestIdHeader === 'string'
        ? requestIdHeader
        : Array.isArray(requestIdHeader) && requestIdHeader.length > 0
          ? requestIdHeader[0]
          : uuidv4();
    store.set('requestId', requestId);
    request.id = requestId; // Attach to request object for potential later use

    const apiKey = request.headers['x-api-key'];
    if (apiKey) {
      store.set('apiKey', apiKey);
    }

    const userAgentHeader = request.headers['user-agent'];
    const userAgent =
      typeof userAgentHeader === 'string'
        ? userAgentHeader
        : Array.isArray(userAgentHeader) && userAgentHeader.length > 0
          ? userAgentHeader[0]
          : undefined;
    if (userAgent) {
      store.set('userAgent', userAgent);
    }

    // Assuming userId might be available on request.user after authentication
    // if (request.user && request.user.id) {
    //   store.set('userId', request.user.id);
    // }

    asyncLocalStorage.run(store, () => {
      done();
    });
  });

  // Request/Response Logging Middleware
  server.addHook('onRequest', async (request) => {
    logger.info('Incoming request', {
      method: request.method,
      url: request.url,
      headers: request.headers,
      ip: request.ip,
    });
  });

  server.addHook('onSend', async (request, reply, payload) => {
    logger.info('Outgoing response', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      payload,
    });
  });

  // Middleware: Router
  server.register(router);

  // Health endpoint
  server.get('/health', async (_request, reply) => {
    return reply.send({ status: 'up', version: APP_VERSION });
  });

  server.get('/health/detailed', async (_request, reply) => {
    const detailedHealth = await getDetailedHealth(APP_VERSION);
    const statusCode =
      detailedHealth.overallStatus === 'down'
        ? 503
        : detailedHealth.overallStatus === 'degraded'
          ? 200
          : 200;
    return reply.code(statusCode).send(detailedHealth);
  });

  // Test routes for error handler (only in test environment)
  if (process.env.NODE_ENV === 'test') {
    server.get('/test-500', async () => {
      throw new Error('Unexpected error');
    });

    server.get('/test-400', async () => {
      const schema = z.object({ name: z.string().min(1) });
      schema.parse({}); // This will throw a ZodError
    });

    server.get('/test-db-unavailable', async () => {
      const error = new Error('Database connection failed');
      (error as any).code = 'P1001'; // Prisma error code for can't reach database server
      throw error;
    });
  }

  // Express-style error handler
  server.setErrorHandler((error: FastifyError, request, reply) => {
    logger.error('Global error handler caught an error', {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      requestUrl: request.url,
    });

    if (isDatabaseUnavailableError(error)) {
      return sendServiceUnavailable(reply, 'Database unavailable');
    }

    // Operational, trusted error: send message to client
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return errorResponse(
        reply,
        error.statusCode,
        error.message,
        'CLIENT_ERROR'
      );
    }

    // Programming or other unknown error: don't leak error details
    return errorResponse(
      reply,
      500,
      'An unexpected error occurred',
      'SERVER_ERROR'
    );
  });

  // Ensure Prisma client is disconnected on application shutdown
  process.on('SIGINT', async () => {
    await disconnectPrisma();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await disconnectPrisma();
    process.exit(0);
  });

  return server;
}

export default buildApp;
