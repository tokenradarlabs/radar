import 'dotenv/config';
import fastify from "fastify";
import rateLimit from '@fastify/rate-limit';
import router from "./router";
import { prisma } from './utils/prisma';
import { initializeCronService } from './services/priceCronService';

const server = fastify({
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== "development"),
});

// Initialize price collection cron service
const cronService = initializeCronService(prisma);

// Start the cron service when the server starts
server.addHook('onReady', async () => {
  cronService.start();
  console.log('🕒 Price collection cron service started');
});

// Gracefully stop the cron service when the server shuts down
server.addHook('onClose', async () => {
  cronService.stop();
  await prisma.$disconnect();
  console.log('🔒 Price collection cron service stopped and database connection closed');
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
