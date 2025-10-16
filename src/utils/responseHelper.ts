import { FastifyReply } from "fastify";
import { isDatabaseUnavailableError } from "./db";
import { Response } from "../types/responses";

/**
 * Standard HTTP status codes for API responses
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Sends a standardized success response
 * @param reply Fastify reply object
 * @param data The data to send in the response
 * @param statusCode HTTP status code (defaults to 200)
 */
export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode: number = HTTP_STATUS.OK
): void {
  const response: Response<T> = {
    success: true,
    data,
  };

  reply.status(statusCode).send(response);
}

/**
 * Sends a standardized error response
 * @param reply Fastify reply object
 * @param error Error message
 * @param statusCode HTTP status code
 */
export function sendError(
  reply: FastifyReply,
  error: string,
  statusCode: number
): void {
  const response: Response<never> = {
    success: false,
    error,
  };

  reply.status(statusCode).send(response);
}

/**
 * Sends a 400 Bad Request error response
 */
export function sendBadRequest(reply: FastifyReply, error: string): void {
  sendError(reply, error, HTTP_STATUS.BAD_REQUEST);
}

/**
 * Sends a 404 Not Found error response
 */
export function sendNotFound(reply: FastifyReply, error: string): void {
  sendError(reply, error, HTTP_STATUS.NOT_FOUND);
}

/**
 * Sends a 500 Internal Server Error response
 */
export function sendInternalError(
  reply: FastifyReply,
  error: string = "Internal server error"
): void {
  sendError(reply, error, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

/**
 * Sends a 401 Unauthorized error response
 */
export function sendUnauthorized(
  reply: FastifyReply,
  error: string = "Authentication required"
): void {
  sendError(reply, error, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Sends a 429 Too Many Requests error response
 */
export function sendTooManyRequests(
  reply: FastifyReply,
  error: string = "Rate limit exceeded"
): void {
  sendError(reply, error, HTTP_STATUS.TOO_MANY_REQUESTS);
}

/**
 * Sends a 503 Service Unavailable error response
 */
export function sendServiceUnavailable(
  reply: FastifyReply,
  error: string = "Service temporarily unavailable"
): void {
  sendError(reply, error, HTTP_STATUS.SERVICE_UNAVAILABLE);
}

/**
 * Standard controller catch-all handler that maps DB outages to 503
 */
export function handleControllerError(
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string = "Internal server error"
): void {
  if (isDatabaseUnavailableError(error)) {
    return sendServiceUnavailable(reply, "Database unavailable");
  }
  // Fallback to 500
  sendInternalError(reply, fallbackMessage);
}

/**
 * Detects if an error is related to rate limiting
 */
export function isRateLimitError(error: unknown, reply: FastifyReply): boolean {
  const asAny = error as any;
  const rawStatusCode = (asAny?.statusCode ?? asAny?.status) as number | string | undefined;
  const statusCode = typeof rawStatusCode === 'string' ? parseInt(rawStatusCode, 10) : rawStatusCode;
  const code = (asAny?.code as string | undefined)?.toUpperCase();
  const headers = (asAny?.headers as Record<string, any> | undefined) ?? undefined;
  const hasRateLimitHeaders = !!(headers && (headers['retry-after'] || headers['Retry-After'] || headers['x-ratelimit-limit']));
  
  // Also detect if rate limit headers were already attached to the reply
  const rlHeaderOnReply = (reply.getHeader('x-ratelimit-limit') ?? reply.getHeader('X-RateLimit-Limit') ?? reply.getHeader('retry-after') ?? reply.getHeader('Retry-After')) !== undefined;
  const messageIndicatesRl = typeof asAny?.message === 'string' && (asAny.message.includes('Too Many Requests') || asAny.message.toLowerCase().includes('rate limit'));
  
  return (statusCode === 429) || (code?.includes('RATE_LIMIT') ?? false) || hasRateLimitHeaders || rlHeaderOnReply || messageIndicatesRl;
}

/**
 * Handles rate limit errors by sending a 429 response with appropriate headers
 */
export function handleRateLimitError(
  reply: FastifyReply,
  error: unknown
): void {
  const asAny = error as any;
  const headers = (asAny?.headers as Record<string, any> | undefined) ?? undefined;
  
  const message = typeof asAny?.message === 'string' && asAny.message.length > 0
    ? asAny.message
    : 'Rate limit exceeded';
    
  if (headers) reply.headers(headers);
  reply.status(429).send({ success: false, error: message });
}

/**
 * Global error handler that processes various error types
 */
export function handleGlobalError(
  error: unknown,
  reply: FastifyReply,
  isDatabaseUnavailableError: (error: unknown) => boolean
): void {
  // If a response has already been sent (e.g., by rate limiter), do not override it
  if ((reply as any).sent || reply.raw.headersSent) {
    return;
  }
  
  if (isDatabaseUnavailableError(error)) {
    sendServiceUnavailable(reply, 'Database unavailable');
    return;
  }
  
  // Handle rate limit errors
  if (isRateLimitError(error, reply)) {
    handleRateLimitError(reply, error);
    return;
  }
  
  // If error carries a valid HTTP status code, preserve it
  const asAny = error as any;
  const rawStatusCode = (asAny?.statusCode ?? asAny?.status) as number | string | undefined;
  const statusCode = typeof rawStatusCode === 'string' ? parseInt(rawStatusCode, 10) : rawStatusCode;
  
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode <= 599) {
    const message = statusCode >= 500 ? 'Internal server error' : (typeof asAny?.message === 'string' && asAny.message.length > 0 ? asAny.message : 'Request failed');
    reply.status(statusCode).send({ success: false, error: message });
    return;
  }
  
  // Fallback to 500
  reply.status(500).send({ success: false, error: 'Internal server error' });
}
