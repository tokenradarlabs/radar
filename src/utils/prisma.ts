import { PrismaClient } from '@prisma/client';
import { isDatabaseUnavailableError } from './db';
import { logger } from './logger';
import { FastifyPluginAsync } from 'fastify';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export let prisma: PrismaClient;

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
  }

  // Connect to the database
  try {
    await prisma.$connect();
    logger.info('Database connected successfully.');
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      logger.error(
        'Failed to connect to the database. ' +
          'Please ensure the database server is running and accessible, ' +
          'and your connection string in the .env file is correct. ' +
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1); // Exit the process if database connection fails
    } else {
      logger.error(
        `An unexpected error occurred during database connection: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error; // Re-throw other unexpected errors
    }
  }

  // Disconnect Prisma when the Fastify app closes
  fastify.addHook('onClose', async (instance) => {
    logger.info('Disconnecting Prisma from database...');
    const startTime = process.hrtime.bigint();
    await instance.prisma.$disconnect();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds
    logger.info('Prisma database disconnected.', { durationMs: duration });
  });

  // Decorate Fastify instance with Prisma for easy access
  fastify.decorate('prisma', prisma);
};

export default prismaPlugin;

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

