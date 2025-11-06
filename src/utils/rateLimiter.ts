import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { validateEnvironmentVariables } from './envValidation';

const rateLimiterPlugin: FastifyPluginAsync = async (fastify) => {
  const {
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_TIME_WINDOW,
    RATE_LIMIT_EXCLUDE_ROUTES,
    RATE_LIMIT_BURST_ALLOWANCE,
  } = validateEnvironmentVariables();

  const excludeRoutes = RATE_LIMIT_EXCLUDE_ROUTES
    ? RATE_LIMIT_EXCLUDE_ROUTES.split(',').map((route) => route.trim())
    : ['/health']; // Default exclude health route

  fastify.register(rateLimit, {
    global: false, // Apply per-route or per-plugin
    max: parseInt(RATE_LIMIT_MAX_REQUESTS || '100', 10), // Default to 100 requests
    timeWindow: RATE_LIMIT_TIME_WINDOW || '1 minute', // Default to 1 minute
    burst: (request) => {
      const apiKey = request.headers['x-api-key'] as string;
      return apiKey ? parseInt(RATE_LIMIT_BURST_ALLOWANCE || '0', 10) : 0;
    },
    errorResponseBuilder: function (_req, context) {
      return {
        success: false,
        error: `Rate limit exceeded, retry in ${context.after}.`,
      };
    },
    keyGenerator: (request) => {
      // Use API key if present, otherwise fall back to IP address
      const apiKey = request.headers['x-api-key'] as string;
      if (apiKey) {
        return `api-key-${apiKey}`;
      }
      return `ip-${request.ip}`;
    },
    // Apply rate limiting to all routes by default, except excluded ones
    // This is a simplified approach; for more granular control,
    // rateLimit should be applied to specific routes or groups of routes.
    // For this request, we'll apply it globally and exclude specific paths.
    hook: 'onRequest', // Apply before route handler
    // This will apply the rate limit to all routes that are not explicitly excluded
    // by the `skip` function.
    skip: (request) => {
      return excludeRoutes.includes(request.routerPath || request.url);
    },
  });
};

export default fp(rateLimiterPlugin);
