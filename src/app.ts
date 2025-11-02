import 'dotenv/config';
import fastify, { FastifyError, FastifyInstance } from 'fastify';
import rateLimiterPlugin from './utils/rateLimiter';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import router from './router';
import { z } from 'zod';
import {
  checkDatabaseConnection,
  isDatabaseUnavailableError,
} from './utils/db';
import { sendServiceUnavailable, errorResponse } from './utils/responseHelper';
import logger, { asyncLocalStorage } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';

export async function buildApp(): Promise<FastifyInstance> {
  const server = fastify({
    // Logger only for production
    logger: !!(process.env.NODE_ENV !== 'development'),
    // Set request size limits for security
    bodyLimit: 1048576, // 1MB limit for request body
  });

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
  server.register(cors, {
    origin:
      process.env.NODE_ENV === 'production'
        ? [
            process.env.ALLOWED_ORIGINS?.split(',') || 'https://tokenradar.com',
          ].flat()
        : true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  });

  // Register rate limiter plugin
  server.register(rateLimiterPlugin);

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
    const dbOk = await checkDatabaseConnection();
    if (!dbOk) {
      return sendServiceUnavailable(reply, 'Database unavailable');
    }
    return reply.send({ status: 'ok' });
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
      return errorResponse(reply, error.statusCode, error.message);
    }

    // Programming or other unknown error: don't leak error details
    return errorResponse(reply, 500, 'An unexpected error occurred');
  });

  return server;
}

export default buildApp;
