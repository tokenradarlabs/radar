import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Response } from '../../types/responses';
import { handleControllerError } from '../../utils/responseHelper';
import { IAuthUser } from '../../types/user';
import { loginRequestSchema, LoginRequest, LoginService } from '../../lib/auth';

export default async function loginController(fastify: FastifyInstance) {
  fastify.post<{ Body: LoginRequest }>(
    '/login',
    async function (
      request: FastifyRequest<{ Body: LoginRequest }>,
      reply: FastifyReply
    ) {
      try {
        const validatedData = loginRequestSchema.parse(request.body);
        const result = await LoginService.loginUser(validatedData);

        const response: Response<IAuthUser & { token: string }> = {
          success: true,
          data: result,
        };
        return reply.code(200).send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response: Response<IAuthUser> = {
            success: false,
            error: error.errors[0].message,
          };
          return reply.code(400).send(response);
        }

        if (error instanceof Error) {
          if (
            error.message.includes('User Does Not Exist') ||
            error.message === 'Invalid credentials'
          ) {
            const response: Response<IAuthUser> = {
              success: false,
              error: error.message,
            };
            return reply.code(401).send(response);
          }
        }

        handleControllerError(reply, error, 'Internal server error');
        return;
      }
    }
  );
}
