import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { promises } from 'fs';
import { resolve } from 'path';
import logger from '../utils/logger';

const { readFile } = promises;

export default async function indexController(fastify: FastifyInstance) {
  // GET /
  fastify.get(
    '/',
    async function (request: FastifyRequest, reply: FastifyReply) {
      logger.info('Serving index.html', { url: request.url });
      try {
        const indexHtmlPath = resolve(__dirname, '../../static/index.html');
        const indexHtmlContent = await readFile(indexHtmlPath);
        reply
          .header('Content-Type', 'text/html; charset=utf-8')
          .send(indexHtmlContent);
      } catch (error) {
        logger.error('Error serving index.html', { error: error.message });
        throw error;
      }
    }
  );
}
