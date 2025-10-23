import { FastifyReply } from 'fastify';
import { isDatabaseUnavailableError } from './db';
import { Response } from '../types/responses';

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
export function errorResponse(
  reply: FastifyReply,
  statusCode: number,
  message: string
): void {
  const response: Response<never> = {
    success: false,
    error: message,
  };

  reply.status(statusCode).send(response);
}

/**
 * Sends a 400 Bad Request error response
 */
export function sendBadRequest(reply: FastifyReply, error: string): void {
  errorResponse(reply, HTTP_STATUS.BAD_REQUEST, error);
}

/**
 * Sends a 404 Not Found error response
 */
export function sendNotFound(reply: FastifyReply, error: string): void {
  errorResponse(reply, HTTP_STATUS.NOT_FOUND, error);
}

/**
 * Sends a 500 Internal Server Error response
 */
export function sendInternalError(
  reply: FastifyReply,
  error: string = 'Internal server error'
): void {
  errorResponse(reply, HTTP_STATUS.INTERNAL_SERVER_ERROR, error);
}

/**
 * Sends a 401 Unauthorized error response
 */
export function sendUnauthorized(
  reply: FastifyReply,
  error: string = 'Authentication required'
): void {
  errorResponse(reply, HTTP_STATUS.UNAUTHORIZED, error);
}

/**
 * Sends a 429 Too Many Requests error response
 */
export function sendTooManyRequests(
  reply: FastifyReply,
  error: string = 'Rate limit exceeded'
): void {
  errorResponse(reply, HTTP_STATUS.TOO_MANY_REQUESTS, error);
}

/**
 * Sends a 503 Service Unavailable error response
 */
export function sendServiceUnavailable(
  reply: FastifyReply,
  error: string = 'Service temporarily unavailable'
): void {
  errorResponse(reply, HTTP_STATUS.SERVICE_UNAVAILABLE, error);
}
