import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { verify } from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/envValidation';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
    };
  }
}

const authenticatePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user', null);

  fastify.addHook('preHandler', async (request, reply) => {
    if (!request.headers.authorization) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
      return;
    }
    try {
      const token = request.headers.authorization.split(' ')[1];
      const decoded: any = verify(token, JWT_SECRET);
      request.user = { id: decoded.userId };
    } catch (err) {
      reply.code(401).send({ success: false, error: 'Unauthorized' });
    }
  });
};

export default fp(authenticatePlugin);
