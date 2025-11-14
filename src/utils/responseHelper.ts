import { FastifyReply } from 'fastify';
import { isDatabaseUnavailableError } from './db';
import { Response, SuccessResponse, ErrorResponse } from '../types/responses';

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
  CONFLICT: 409,
} as const;

/**
 * Stable error codes for API responses
 */
export const ERROR_CODES = {
  // Generic Errors
  BAD_REQUEST: 'ERR_BAD_REQUEST',
  UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  FORBIDDEN: 'ERR_FORBIDDEN',
  NOT_FOUND: 'ERR_NOT_FOUND',
  CONFLICT: 'ERR_CONFLICT',
  INTERNAL_SERVER_ERROR: 'ERR_INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'ERR_SERVICE_UNAVAILABLE',
  TOO_MANY_REQUESTS: 'ERR_TOO_MANY_REQUESTS',

  // API Key Specific Errors
  API_KEY_INVALID: 'ERR_API_KEY_INVALID',
  API_KEY_EXPIRED: 'ERR_API_KEY_EXPIRED',
  API_KEY_DISABLED: 'ERR_API_KEY_DISABLED',
  API_KEY_NOT_FOUND: 'ERR_API_KEY_NOT_FOUND',
  API_KEY_MISSING: 'ERR_API_KEY_MISSING',
  API_KEY_UNAUTHORIZED: 'ERR_API_KEY_UNAUTHORIZED',
  API_KEY_LIMIT_EXCEEDED: 'ERR_API_KEY_LIMIT_EXCEEDED',

  // Authentication & Authorization Errors
  AUTHENTICATION_FAILED: 'ERR_AUTHENTICATION_FAILED',
  INVALID_CREDENTIALS: 'ERR_INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ERR_ACCOUNT_LOCKED',
  SESSION_EXPIRED: 'ERR_SESSION_EXPIRED',
  PERMISSION_DENIED: 'ERR_PERMISSION_DENIED',

  // Validation Errors
  VALIDATION_FAILED: 'ERR_VALIDATION_FAILED',
  INVALID_INPUT: 'ERR_INVALID_INPUT',
  MISSING_FIELD: 'ERR_MISSING_FIELD',
  INVALID_FORMAT: 'ERR_INVALID_FORMAT',
  VALUE_OUT_OF_RANGE: 'ERR_VALUE_OUT_OF_RANGE',

  // Resource & Data Errors
  RESOURCE_NOT_FOUND: 'ERR_RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'ERR_RESOURCE_ALREADY_EXISTS',
  DATA_INTEGRITY_VIOLATION: 'ERR_DATA_INTEGRITY_VIOLATION',
  EXTERNAL_SERVICE_ERROR: 'ERR_EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'ERR_DATABASE_ERROR',

  // Business Logic Errors
  TRANSACTION_FAILED: 'ERR_TRANSACTION_FAILED',
  INSUFFICIENT_FUNDS: 'ERR_INSUFFICIENT_FUNDS',
  PRODUCT_UNAVAILABLE: 'ERR_PRODUCT_UNAVAILABLE',
  ORDER_PROCESSING_FAILED: 'ERR_ORDER_PROCESSING_FAILED',
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
): FastifyReply {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  return reply.status(statusCode).send(response);
}

/**
 * Sends a standardized error response
 * @param reply Fastify reply object
 * @param error Error message
 * @param statusCode HTTP status code
 */
export function errorResponse(
  reply: FastifyReply,
  statusCode: number,
  message: string,
  code: string
): FastifyReply {
  const response: ErrorResponse = {
    success: false,
    error: message,
    code,
  };

  return reply.status(statusCode).send(response);
}

/**
 * Sends a 400 Bad Request error response
 */
export function sendBadRequest(
  reply: FastifyReply,
  error: string,
  code: string = ERROR_CODES.BAD_REQUEST
): FastifyReply {
  return errorResponse(reply, HTTP_STATUS.BAD_REQUEST, error, code);
}

/**
 * Sends a 404 Not Found error response
 */
export function sendNotFound(reply: FastifyReply, error: string): FastifyReply {
  return errorResponse(
    reply,
    HTTP_STATUS.NOT_FOUND,
    error,
    ERROR_CODES.NOT_FOUND
  );
}

/**
 * Sends a 500 Internal Server Error response
 */
export function sendInternalError(
  reply: FastifyReply,
  error: string = 'Internal server error',
  code: string = ERROR_CODES.INTERNAL_SERVER_ERROR
): FastifyReply {
  return errorResponse(reply, HTTP_STATUS.INTERNAL_SERVER_ERROR, error, code);
}

/**
 * Sends a 401 Unauthorized error response
 */
export function sendUnauthorized(
  reply: FastifyReply,
  error: string = 'Authentication required',
  code: string = ERROR_CODES.UNAUTHORIZED
): FastifyReply {
  return errorResponse(reply, HTTP_STATUS.UNAUTHORIZED, error, code);
}

/**
 * Sends a 429 Too Many Requests error response
 */
export function sendTooManyRequests(
  reply: FastifyReply,
  error: string = 'Rate limit exceeded'
): FastifyReply {
  return errorResponse(
    reply,
    HTTP_STATUS.TOO_MANY_REQUESTS,
    error,
    ERROR_CODES.TOO_MANY_REQUESTS
  );
}

/**
 * Sends a 503 Service Unavailable error response
 */
export function sendServiceUnavailable(
  reply: FastifyReply,
  error: string = 'Service temporarily unavailable'
): FastifyReply {
  return errorResponse(
    reply,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    error,
    ERROR_CODES.SERVICE_UNAVAILABLE
  );
}
