import { buildApp } from './app'; // Changed import
import { validateEnvironmentVariables } from './utils/envValidation';
import { logger } from './utils/logger';

(async () => {
  let step = 'Environment validation';
  try {
    const env = validateEnvironmentVariables();
    logger.info('Environment variables validated successfully', {
      step: 'Environment validation',
    });

    const isProduction = env.NODE_ENV === 'production';

    let FASTIFY_PORT: number;
    // Option A: Keep defaults in envValidation and remove any local dev fallback in src/index.ts.
    // envValidation will return '4000' for non-production if FASTIFY_PORT is not set.
    if (env.FASTIFY_PORT != null && String(env.FASTIFY_PORT).trim() !== '') {
      const parsed = Number(env.FASTIFY_PORT);
      if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
        logger.error('Invalid FASTIFY_PORT value', {
          step: 'Server configuration',
          port: env.FASTIFY_PORT,
        });
        process.exit(1);
      }
      FASTIFY_PORT = parsed;
    } else {
      // This else block should ideally not be reached if envValidation provides a default.
      // However, as a safeguard, if it is reached in production, it's an error.
      if (isProduction) {
        logger.error('FASTIFY_PORT must be explicitly set in production', {
          step: 'Server configuration',
        });
        process.exit(1);
      }
      // If envValidation somehow didn't provide a default and it's not production,
      // we'll default to 4000 to match envValidation's intended behavior.
      FASTIFY_PORT = 4000;
    }

    step = 'Application build';
    const app = await buildApp(); // Call buildApp to get the server instance

    step = 'Server listening';
    await app.listen({ port: FASTIFY_PORT });

    logger.info(`Fastify server running`, {
      step: 'Server listening',
      port: FASTIFY_PORT,
      url: `http://localhost:${FASTIFY_PORT}`,
    });
    logger.info(`Route index: /`, { step: 'Server routes' });
    logger.info(`Route user: /api/v1/user`, { step: 'Server routes' });
  } catch (error) {
    logger.error(`${step} failed`, {
      step: step,
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
})();
