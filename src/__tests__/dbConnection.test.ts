import { buildApp } from '../app';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { vi } from 'vitest';

// Mock the entire prisma module to control its behavior
vi.mock('../utils/prisma', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    prisma: {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    },
    connectPrisma: vi.fn(),
    disconnectPrisma: vi.fn(),
  };
});

// Mock logger to prevent actual logs during tests and to spy on calls
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Database Connection Handling', () => {
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit was called.');
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log an error and exit if database connection fails at startup', async () => {
    // Simulate a database connection failure
    (prisma.$connect as vi.Mock).mockRejectedValueOnce(
      new Error("P1001: Can't reach database server")
    );
    (logger.error as vi.Mock).mockImplementation(() => {}); // Suppress error logs in test output

    // Temporarily restore connectPrisma to its original implementation for this test
    // This is because we want to test the actual connectPrisma logic, not the mock
    const originalConnectPrisma = vi
      .importActual('../utils/prisma')
      .then((m) => m.connectPrisma);
    (vi.mocked(await originalConnectPrisma) as vi.Mock).mockImplementation(
      async () => {
        try {
          await prisma.$connect();
          logger.info('Database connected successfully.');
        } catch (error) {
          logger.error(
            'Failed to connect to the database. ' +
              'Please ensure the database server is running and accessible, ' +
              'and your connection string in the .env file is correct. ' +
              `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          process.exit(1);
        }
      }
    );

    await expect(buildApp()).rejects.toThrow('process.exit was called.');

    expect(prisma.$connect).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to connect to the database.')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should call disconnectPrisma on SIGINT', async () => {
    const server = await buildApp();
    // Simulate SIGINT signal
    process.emit('SIGINT', 'SIGINT');
    await vi.waitFor(() => expect(prisma.$disconnect).toHaveBeenCalledTimes(1));
    await server.close();
  });

  it('should call disconnectPrisma on SIGTERM', async () => {
    const server = await buildApp();
    // Simulate SIGTERM signal
    process.emit('SIGTERM', 'SIGTERM');
    await vi.waitFor(() => expect(prisma.$disconnect).toHaveBeenCalledTimes(1));
    await server.close();
  });
});
