import { validateEnvironmentVariables } from '../utils/envValidation';
import { vi } from 'vitest';

describe('validateEnvironmentVariables', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'some_url');
    vi.stubEnv('JWT_SECRET', 'some_secret');
    vi.stubEnv('ANKR_API_KEY', 'some_key');
    vi.stubEnv('COINGECKO_API_KEY', 'some_other_key');
    vi.stubEnv('ALLOWED_ORIGINS', 'https://example.com');
    vi.stubEnv('NODE_ENV', 'production'); // Default to production for most tests
    vi.stubEnv('FASTIFY_PORT', '3000'); // Default port
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should throw an error if a required environment variable is missing', () => {
    vi.stubEnv('DATABASE_URL', undefined as any);
    expect(() => validateEnvironmentVariables()).toThrow(
      'Missing required environment variables: DATABASE_URL. Please ensure these are set in your environment or .env file.'
    );
  });

  it('should throw an error if a required environment variable is empty', () => {
    vi.stubEnv('DATABASE_URL', '');
    expect(() => validateEnvironmentVariables()).toThrow(
      'Environment variables cannot be empty: DATABASE_URL. Please provide valid values for these variables.'
    );
  });

  it('should throw an error if a required environment variable is only whitespace', () => {
    vi.stubEnv('DATABASE_URL', '   ');
    expect(() => validateEnvironmentVariables()).toThrow(
      'Environment variables cannot be empty: DATABASE_URL. Please provide valid values for these variables.'
    );
  });

  it('should throw an error if multiple required environment variables are missing', () => {
    vi.stubEnv('DATABASE_URL', undefined as any);
    vi.stubEnv('JWT_SECRET', undefined as any);
    expect(() => validateEnvironmentVariables()).toThrow(
      'Missing required environment variables: DATABASE_URL, JWT_SECRET. Please ensure these are set in your environment or .env file.'
    );
  });

  it('should throw an error if multiple required environment variables are empty', () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('JWT_SECRET', ' ');
    expect(() => validateEnvironmentVariables()).toThrow(
      'Environment variables cannot be empty: DATABASE_URL, JWT_SECRET. Please provide valid values for these variables.'
    );
  });

  it('should not throw an error if all required environment variables are present and valid', () => {
    expect(() => validateEnvironmentVariables()).not.toThrow();
  });

  it('should return default FASTIFY_PORT if NODE_ENV is development and FASTIFY_PORT is not set', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('FASTIFY_PORT', undefined as any);
    const env = validateEnvironmentVariables();
    expect(env.FASTIFY_PORT).toBe('4000');
  });

  it('should return default FASTIFY_PORT if NODE_ENV is test and FASTIFY_PORT is not set', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('FASTIFY_PORT', undefined as any);
    const env = validateEnvironmentVariables();
    expect(env.FASTIFY_PORT).toBe('4000');
  });

  it('should use provided FASTIFY_PORT even if NODE_ENV is development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('FASTIFY_PORT', '5000');
    const env = validateEnvironmentVariables();
    expect(env.FASTIFY_PORT).toBe('5000');
  });

  it('should not set default FASTIFY_PORT if NODE_ENV is production and FASTIFY_PORT is not set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('FASTIFY_PORT', undefined as any);
    const env = validateEnvironmentVariables();
    expect(env.FASTIFY_PORT).toBeUndefined();
  });

  it('should throw an error if ALLOWED_ORIGINS is missing', () => {
    vi.stubEnv('ALLOWED_ORIGINS', undefined as any);
    expect(() => validateEnvironmentVariables()).toThrow(
      'Missing required environment variables: ALLOWED_ORIGINS. Please ensure these are set in your environment or .env file.'
    );
  });

  it('should throw an error if ALLOWED_ORIGINS is empty', () => {
    vi.stubEnv('ALLOWED_ORIGINS', '');
    expect(() => validateEnvironmentVariables()).toThrow(
      'Environment variables cannot be empty: ALLOWED_ORIGINS. Please provide valid values for these variables.'
    );
  });

  it('should throw an error if ALLOWED_ORIGINS is only whitespace', () => {
    vi.stubEnv('ALLOWED_ORIGINS', '   ');
    expect(() => validateEnvironmentVariables()).toThrow(
      'Environment variables cannot be empty: ALLOWED_ORIGINS. Please provide valid values for these variables.'
    );
  });

  it('should return the correct ALLOWED_ORIGINS if present and valid', () => {
    vi.stubEnv('ALLOWED_ORIGINS', 'https://test.com');
    const env = validateEnvironmentVariables();
    expect(env.ALLOWED_ORIGINS).toBe('https://test.com');
  });

  it('should throw security error if JWT_SECRET is default insecure value', () => {
    vi.stubEnv('JWT_SECRET', 'your-secret-key');
    expect(() => validateEnvironmentVariables()).toThrow(
      'Security Error: JWT_SECRET is set to the default insecure value. Please set a secure random JWT_SECRET in your environment variables.'
    );
  });
});
