import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import logger from '../utils/logger';
import { ENV } from '../utils/envValidation';

declare module 'fastify' {
  interface FastifyRequest {
    requestStartTime: bigint;
  }
}

async function requestTimingPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    request.requestStartTime = process.hrtime.bigint();
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    if (ENV.ENABLE_REQUEST_TIMING_LOGS) {
      const duration = Number(process.hrtime.bigint() - request.requestStartTime) / 1_000_000; // duration in milliseconds
      logger.info(
        `Request Timing: ${request.id} - ${request.method} ${request.url} - ${reply.statusCode} - ${duration.toFixed(2)}ms`
      );
    }
  });
}

export default fp(requestTimingPlugin);
