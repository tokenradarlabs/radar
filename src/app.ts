import 'dotenv/config';
import fastify from "fastify";
import rateLimit from '@fastify/rate-limit';
import router from "./router";
import { checkDatabaseConnection, isDatabaseUnavailableError } from './utils/db';
import { sendServiceUnavailable } from './utils/responseHelper';

const server = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== "development"),
});

// Register rate limiter plugin
server.register(rateLimit, {
  global: false, // Disable global rate limiting
  max: 5, // Maximum 5 requests
  timeWindow: '1 minute', // Per minute
  errorResponseBuilder: function (_, context) {
    return {
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${context.after}`
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

// Centralized error handler for DB outages
server.setErrorHandler((error, _request, reply) => {
  if (isDatabaseUnavailableError(error)) {
    return sendServiceUnavailable(reply, 'Database unavailable');
  }
  // Let Fastify default handle others
  reply.status(500).send({ success: false, error: 'Internal server error' });
});

export default server;
