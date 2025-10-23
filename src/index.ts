import { buildApp } from "./app"; // Changed import
import { validateEnvironmentVariables } from "./utils/envValidation";

// Validate environment variables before starting the server
try {
  const env = validateEnvironmentVariables();
  console.log('✅ Environment variables validated successfully');

  const isProduction = env.NODE_ENV === 'production';

  let FASTIFY_PORT: number;
  if (env.FASTIFY_PORT != null && String(env.FASTIFY_PORT).trim() !== '') {
    const parsed = Number(env.FASTIFY_PORT);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
      console.error('❌ Invalid FASTIFY_PORT value:', env.FASTIFY_PORT);
      process.exit(1);
    }
    FASTIFY_PORT = parsed;
  } else {
    if (isProduction) {
      console.error('❌ FASTIFY_PORT must be explicitly set in production');
      process.exit(1);
    }
    FASTIFY_PORT = 3006; // dev/test fallback
  }

  const app = await buildApp(); // Call buildApp to get the server instance
  app.listen({ port: FASTIFY_PORT });

  console.log(
    `🚀  Fastify server running on port http://localhost:${FASTIFY_PORT}`
  );
  console.log(`Route index: /`);
  console.log(`Route user: /api/v1/user`);
} catch (error) {
  console.error('❌ Environment validation failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
