import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../lib/api/user/user.service';

export default async function userController(fastify: FastifyInstance) {
  // GET /auth/
  fastify.get(
    '/',
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const userData = await UserService.getUserData();
      reply.send(userData);
    }
  );
}
