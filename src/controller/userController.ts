import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../lib/api/user/user.service';
import { IUserResponse } from '../types/responses';

export default async function userController(fastify: FastifyInstance) {
  // GET /auth/
  fastify.get(
    '/',
    async function (_request: FastifyRequest, reply: FastifyReply<IUserResponse>) {
      const userData = await UserService.getUserData();
      reply.send({ success: true, data: userData });
    }
  );
}
