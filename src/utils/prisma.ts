import { PrismaClient } from '@prisma/client';
import { isDatabaseUnavailableError } from './db';
import { logger } from './logger';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully.');
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      logger.error(
        'Failed to connect to the database. ' +
          'Please ensure the database server is running and accessible, ' +
          'and your connection string in the .env file is correct. ' +
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      process.exit(1); // Exit the process if database connection fails
    } else {
      logger.error(
        `An unexpected error occurred during database connection: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw error; // Re-throw other unexpected errors
    }
  }
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected.');
}
