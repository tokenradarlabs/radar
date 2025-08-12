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
