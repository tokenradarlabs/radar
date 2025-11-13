import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { validateEnvironmentVariables } from './envValidation';

const { RATE_LIMIT_BURST_ALLOWANCE } = validateEnvironmentVariables();

const burstAllowance = (() => {
  const parsedAllowance = parseInt(RATE_LIMIT_BURST_ALLOWANCE || '0', 10);
  if (isNaN(parsedAllowance) || !Number.isFinite(parsedAllowance) || parsedAllowance < 0) {
    throw new Error('Invalid RATE_LIMIT_BURST_ALLOWANCE environment variable. Must be a non-negative integer.');
  }
  return parsedAllowance;
})();

interface RateLimitOptions {
  maxRequests: number;
  timeWindow?: string;
  excludeRoutes?: string[];
}

const createRateLimiterPlugin = (options: RateLimitOptions): FastifyPluginAsync => {
  const rateLimiterPlugin: FastifyPluginAsync = async (fastify) => {
    const {
      RATE_LIMIT_TIME_WINDOW,
      RATE_LIMIT_EXCLUDE_ROUTES,
    } = validateEnvironmentVariables();

    const excludeRoutes = options.excludeRoutes || RATE_LIMIT_EXCLUDE_ROUTES
      ? (RATE_LIMIT_EXCLUDE_ROUTES || '').split(',').map((route) => route.trim())
      : ['/health']; // Default exclude health route

    fastify.register(rateLimit, {
      global: false, // Apply per-route or per-plugin
      max: options.maxRequests,
      timeWindow: options.timeWindow || RATE_LIMIT_TIME_WINDOW || '1 minute', // Default to 1 minute
      burst: (request: FastifyRequest) => {
        const apiKey = request.headers['x-api-key'] as string;
        return apiKey ? burstAllowance : 0;
      },
      errorResponseBuilder: function (_req, context) {
        return {
          success: false,
          error: `Rate limit exceeded, retry in ${context.after}.`,
        };
      },
      keyGenerator: (request: FastifyRequest) => {
        // Use API key if present, otherwise fall back to IP address
        const apiKey = request.headers['x-api-key'] as string;
        if (apiKey) {
          return `api-key-${apiKey}`;
        }
        return `ip-${request.ip}`;
      },
      hook: 'onRequest', // Apply before route handler
      skip: (request: FastifyRequest) => {
        return excludeRoutes.includes(request.routerPath || request.url);
      },
    });
  };
  return fp(rateLimiterPlugin);
};

export default createRateLimiterPlugin;
