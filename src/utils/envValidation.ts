interface RequiredEnvVars {
  DATABASE_URL: string;
  JWT_SECRET: string;
  ANKR_API_KEY: string;
  COINGECKO_API_KEY: string;
  ALLOWED_ORIGINS: string;
}

interface OptionalEnvVars {
  FASTIFY_PORT?: string;
  NODE_ENV?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_TIME_WINDOW?: string;
  RATE_LIMIT_EXCLUDE_ROUTES?: string;
  RATE_LIMIT_BURST_ALLOWANCE?: string;
  PRICE_CACHE_TTL?: string;
  ENABLE_REQUEST_TIMING_LOGS?: boolean;
}

/**
 * Validates that all required environment variables are present and not empty
 * @throws Error if any required environment variable is missing or empty
 */
export function validateEnvironmentVariables(): RequiredEnvVars &
  OptionalEnvVars {
  const missingVars: string[] = [];
  const emptyVars: string[] = [];

  // Required environment variables
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ANKR_API_KEY',
    'COINGECKO_API_KEY',
    'ALLOWED_ORIGINS',
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    const trimmedValue = value?.trim();

    if (value === undefined) {
      missingVars.push(varName);
    } else if (trimmedValue === '') {
      emptyVars.push(varName);
    }
  }

  // Check for critical security issues
  if (process.env.JWT_SECRET === 'your-secret-key') {
    throw new Error(
      'Security Error: JWT_SECRET is set to the default insecure value. ' +
        'Please set a secure random JWT_SECRET in your environment variables.'
    );
  }

  // Report missing variables
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
        'Please ensure these are set in your environment or .env file.'
    );
  }

  // Report empty variables
  if (emptyVars.length > 0) {
    throw new Error(
      `Environment variables cannot be empty: ${emptyVars.join(', ')}. ` +
        'Please provide valid values for these variables.'
    );
  }

  const nodeEnv = process.env.NODE_ENV?.trim();
  const fastifyPort = process.env.FASTIFY_PORT?.trim();

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    ANKR_API_KEY: process.env.ANKR_API_KEY!,
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY!,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS!,
    FASTIFY_PORT:
      fastifyPort ||
      (nodeEnv === 'development' || nodeEnv === 'test' ? '4000' : undefined),
    NODE_ENV: nodeEnv,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS?.trim(),
    RATE_LIMIT_TIME_WINDOW: process.env.RATE_LIMIT_TIME_WINDOW?.trim(),
    RATE_LIMIT_EXCLUDE_ROUTES: process.env.RATE_LIMIT_EXCLUDE_ROUTES?.trim(),
    RATE_LIMIT_BURST_ALLOWANCE: process.env.RATE_LIMIT_BURST_ALLOWANCE?.trim(),
    PRICE_CACHE_TTL: process.env.PRICE_CACHE_TTL?.trim() || '60000',
    ENABLE_REQUEST_TIMING_LOGS: process.env.ENABLE_REQUEST_TIMING_LOGS?.trim() === 'true',
  };
}

export const ENV = validateEnvironmentVariables();
