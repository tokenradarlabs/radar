import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Response } from '../../types/responses';
import { sendInternalError, ERROR_CODES } from '../../utils/responseHelper';
import { formatValidationError } from '../../utils/validation';
import { IAuthUser } from '../../types/user';
import {
  registerRequestSchema,
  RegisterRequest,
  RegisterService,
} from '../../lib/auth';

export default async function registerController(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterRequest }>(
    '/register',
    async function (
      request: FastifyRequest<{ Body: RegisterRequest }>,
      reply: FastifyReply
    ) {
      try {
        const validatedData = registerRequestSchema.parse(request.body);
        const user = await RegisterService.registerUser(validatedData);

        const response: Response<IAuthUser> = {
          success: true,
          data: user,
        };
        return reply.code(201).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response: Response<IAuthUser> = {
            success: false,
            error: formatValidationError(error),
            code: ERROR_CODES.VALIDATION_FAILED,
          };
          return reply.code(400).send(response);
        }

        if (
          error instanceof Error &&
          error.message === 'Email already exists'
        ) {
          const response: Response<IAuthUser> = {
            success: false,
            error: error.message,
            code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
          };
          return reply.code(409).send(response);
        }

        sendInternalError(
          reply,
          'Internal server error',
          ERROR_CODES.INTERNAL_SERVER_ERROR
        );
        return;
      }
    }
  );
}
