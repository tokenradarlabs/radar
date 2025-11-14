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
  BAD_REQUEST: 'ERR_BAD_REQUEST',
  CONFLICT: 'ERR_CONFLICT',
  UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  FORBIDDEN: 'ERR_FORBIDDEN',
  NOT_FOUND: 'ERR_NOT_FOUND',
  TOO_MANY_REQUESTS: 'ERR_TOO_MANY_REQUESTS',
  SERVICE_UNAVAILABLE: 'ERR_SERVICE_UNAVAILABLE',
  INTERNAL_SERVER_ERROR: 'ERR_INTERNAL_SERVER_ERROR',
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
  error: string
): FastifyReply {
  return errorResponse(reply, HTTP_STATUS.BAD_REQUEST, error, ERROR_CODES.BAD_REQUEST);
}

/**
 * Sends a 404 Not Found error response
 */
export function sendNotFound(reply: FastifyReply, error: string): FastifyReply {
  return errorResponse(reply, HTTP_STATUS.NOT_FOUND, error, ERROR_CODES.NOT_FOUND);
}

/**
 * Sends a 500 Internal Server Error response
 */
export function sendInternalError(
  reply: FastifyReply,
  error: string = 'Internal server error'
): FastifyReply {
  return errorResponse(
    reply,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    error,
    ERROR_CODES.INTERNAL_SERVER_ERROR
  );
}

/**
 * Sends a 401 Unauthorized error response
 */
export function sendUnauthorized(
  reply: FastifyReply,
  error: string = 'Authentication required'
): FastifyReply {
  return errorResponse(
    reply,
    HTTP_STATUS.UNAUTHORIZED,
    error,
    ERROR_CODES.UNAUTHORIZED
  );
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
