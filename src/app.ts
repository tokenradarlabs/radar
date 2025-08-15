import 'dotenv/config';
import fastify from "fastify";
import rateLimit from '@fastify/rate-limit';
import router from "./router";
import { checkDatabaseConnection, isDatabaseUnavailableError } from './utils/db';
import { sendServiceUnavailable, handleGlobalError } from './utils/responseHelper';

const server = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== "development"),
});

// Register rate limiter plugin
server.register(rateLimit, {
  global: false, // Disable global rate limiting
  max: 5, // Maximum 5 requests
  timeWindow: '1 minute', // Per minute
  errorResponseBuilder: function (_req, context) {
    return {
      success: false,
      error: `Rate limit exceeded, retry in ${context.after}`
    }
  }
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

// Centralized error handler for DB outages and rate limiting
server.setErrorHandler((error, _request, reply) => {
  handleGlobalError(error, reply, isDatabaseUnavailableError);
});

export default server;
