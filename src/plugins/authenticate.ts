import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { verify } from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/envValidation';
import { ERROR_CODES } from '../utils/errors';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
    };
  }
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

const authenticatePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.headers.authorization) {
        reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          code: ERROR_CODES.UNAUTHORIZED,
        });
        return;
      }
      try {
        const token = request.headers.authorization.split(' ')[1];
        const decoded: any = verify(token, JWT_SECRET);
        request.user = { id: decoded.userId };
      } catch (err) {
        reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          code: ERROR_CODES.UNAUTHORIZED,
        });
      }
    }
  );
};

export default fp(authenticatePlugin);
