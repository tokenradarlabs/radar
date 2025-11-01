import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../lib/api/user/user.service';
import { IUserResponse } from '../types/responses';
import { sendSuccess } from '../utils/responseHelper';

export default async function userController(fastify: FastifyInstance) {
  // GET /auth/
  fastify.get(
    '/',
    async function (_request: FastifyRequest, reply: FastifyReply<IUserResponse>) {
      const userData = await UserService.getUserData();
      sendSuccess(reply, userData);
    }
  );
}
