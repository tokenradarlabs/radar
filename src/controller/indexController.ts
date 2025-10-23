import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { promises } from 'fs';
import { resolve } from 'path';
import { sendInternalError } from '../utils/responseHelper';

const { readFile } = promises;

export default async function indexController(fastify: FastifyInstance) {
  // GET /
  fastify.get(
    '/',
    async function (_request: FastifyRequest, reply: FastifyReply) {
      try {
        const indexHtmlPath = resolve(__dirname, '../../static/index.html');
        const indexHtmlContent = await readFile(indexHtmlPath);
        reply
          .header('Content-Type', 'text/html; charset=utf-8')
          .send(indexHtmlContent);
      } catch (error) {
        fastify.log.error(error);
        sendInternalError(reply, 'Failed to load index.html');
      }
    }
  );
}
