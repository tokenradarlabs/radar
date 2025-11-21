import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { isDatabaseUnavailableError } from './db';
import { sendServiceUnavailable, errorResponse } from './responseHelper';
import logger from './logger';

export function globalErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error('Global error handler caught an error', {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    requestUrl: request.url,
  });

  if (isDatabaseUnavailableError(error)) {
    return sendServiceUnavailable(reply, 'Database unavailable');
  }

  // Operational, trusted error: send message to client
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return errorResponse(
      reply,
      error.statusCode,
      error.message,
      'CLIENT_ERROR'
    );
  }

  // Programming or other unknown error: don't leak error details
  return errorResponse(
    reply,
    500,
    'An unexpected error occurred',
    'SERVER_ERROR'
  );
}
