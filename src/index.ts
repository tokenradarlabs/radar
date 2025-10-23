import { buildApp } from './app'; // Changed import
import { validateEnvironmentVariables } from './utils/envValidation';

(async () => {
  let step = 'Environment validation';
  try {
    const env = validateEnvironmentVariables();
    console.log('✅ Environment variables validated successfully');

    const isProduction = env.NODE_ENV === 'production';

    let FASTIFY_PORT: number;
    // Option A: Keep defaults in envValidation and remove any local dev fallback in src/index.ts.
    // envValidation will return '4000' for non-production if FASTIFY_PORT is not set.
    if (env.FASTIFY_PORT != null && String(env.FASTIFY_PORT).trim() !== '') {
      const parsed = Number(env.FASTIFY_PORT);
      if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
        console.error('❌ Invalid FASTIFY_PORT value:', env.FASTIFY_PORT);
        process.exit(1);
      }
      FASTIFY_PORT = parsed;
    } else {
      // This else block should ideally not be reached if envValidation provides a default.
      // However, as a safeguard, if it is reached in production, it's an error.
      if (isProduction) {
        console.error('❌ FASTIFY_PORT must be explicitly set in production');
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

    console.log(
      `🚀  Fastify server running on port http://localhost:${FASTIFY_PORT}`
    );
    console.log(`Route index: /`);
    console.log(`Route user: /api/v1/user`);
  } catch (error) {
    console.error(
      `❌ ${step} failed:`,
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
})();
