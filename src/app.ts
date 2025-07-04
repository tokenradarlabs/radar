import 'dotenv/config';
import fastify from "fastify";
import rateLimit from '@fastify/rate-limit';
import router from "./router";

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

export default server;
