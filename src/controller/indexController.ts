import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function indexController(fastify: FastifyInstance) {
  // GET /
  fastify.get(
    '/',
    async function (request: FastifyRequest, reply: FastifyReply) {
      reply.send({ status: 'ok', message: 'Welcome to the API' });
    }
  );
}
