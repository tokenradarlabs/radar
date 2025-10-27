import 'dotenv/config';
import fastify, { FastifyError, FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import router from './router';
import { z } from 'zod';
import {
  checkDatabaseConnection,
  isDatabaseUnavailableError,
} from './utils/db';
import { sendServiceUnavailable, errorResponse } from './utils/responseHelper';
import logger from './utils/logger';

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
  server.register(rateLimit, {
    global: false, // Disable global rate limiting
    max: 5, // Maximum 5 requests
    timeWindow: '1 minute', // Per minute
    errorResponseBuilder: function (_req, context) {
      return {
        success: false,
        error: `Rate limit exceeded, retry in ${context.after}`,
      };
    },
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
