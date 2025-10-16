interface RequiredEnvVars {
  DATABASE_URL: string;
  JWT_SECRET: string;
  ANKR_API_KEY: string;
  COINGECKO_API_KEY: string;
}

interface OptionalEnvVars {
  FASTIFY_PORT?: string;
  NODE_ENV?: string;
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
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];

    if (value === undefined) {
      missingVars.push(varName);
    } else if (value.trim() === '') {
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

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    ANKR_API_KEY: process.env.ANKR_API_KEY!,
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY!,
    FASTIFY_PORT: process.env.FASTIFY_PORT,
    NODE_ENV: process.env.NODE_ENV,
  };
}

/**
 * Gets validated environment variables
 * This should be called after validateEnvironmentVariables()
 */
export function getValidatedEnv(): RequiredEnvVars & OptionalEnvVars {
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    ANKR_API_KEY: process.env.ANKR_API_KEY!,
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY!,
    FASTIFY_PORT: process.env.FASTIFY_PORT,
    NODE_ENV: process.env.NODE_ENV,
  };
}
