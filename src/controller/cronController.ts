import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getCronService } from '../services/priceCronService';
import { prisma } from '../utils/prisma';

export default async function cronController(fastify: FastifyInstance) {
  // Get cron service status
  fastify.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const cronService = getCronService();
      
      if (!cronService) {
        return reply.code(503).send({
          error: 'Cron service not initialized'
        });
      }

      const status = await cronService.getStatus();
      
      return reply.send({
        success: true,
        data: status
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[CronController] Error getting status:', errorMessage);
      
      return reply.code(500).send({
        error: 'Failed to get cron service status',
        message: errorMessage
      });
    }
  });

  // Manually trigger price collection
  fastify.post('/trigger/collection', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const cronService = getCronService();
      
      if (!cronService) {
        return reply.code(503).send({
          error: 'Cron service not initialized'
        });
      }

      await cronService.triggerCollection();
      
      return reply.send({
        success: true,
        message: 'Price collection triggered successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[CronController] Error triggering collection:', errorMessage);
      
      return reply.code(500).send({
        error: 'Failed to trigger price collection',
        message: errorMessage
      });
    }
  });

  // Manually trigger cleanup
  fastify.post('/trigger/cleanup', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const cronService = getCronService();
      
      if (!cronService) {
        return reply.code(503).send({
          error: 'Cron service not initialized'
        });
      }

      await cronService.triggerCleanup();
      
      return reply.send({
        success: true,
        message: 'Database cleanup triggered successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[CronController] Error triggering cleanup:', errorMessage);
      
      return reply.code(500).send({
        error: 'Failed to trigger database cleanup',
        message: errorMessage
      });
    }
  });

  // Get latest price records
  fastify.get('/prices/latest', async (request: FastifyRequest<{
    Querystring: { limit?: string }
  }>, reply: FastifyReply) => {
    try {
      const limit = parseInt(request.query.limit || '10', 10);
      
      // Validate limit
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return reply.code(400).send({
          error: 'Invalid limit parameter. Must be between 1 and 100.'
        });
      }

      const records = await prisma.priceRecord.findMany({
        orderBy: {
          timestamp: 'desc'
        },
        take: limit
      });
      
      return reply.send({
        success: true,
        data: records,
        count: records.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[CronController] Error fetching latest prices:', errorMessage);
      
      return reply.code(500).send({
        error: 'Failed to fetch latest price records',
        message: errorMessage
      });
    }
  });

  // Get price history within date range
  fastify.get('/prices/history', async (request: FastifyRequest<{
    Querystring: { 
      startDate?: string;
      endDate?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const { startDate, endDate } = request.query;
      
      if (!startDate || !endDate) {
        return reply.code(400).send({
          error: 'Both startDate and endDate parameters are required'
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return reply.code(400).send({
          error: 'Invalid date format. Use ISO 8601 date strings.'
        });
      }

      if (start > end) {
        return reply.code(400).send({
          error: 'startDate must be earlier than endDate'
        });
      }

      // Limit to maximum 7 days to prevent large queries
      const maxDays = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      if (end.getTime() - start.getTime() > maxDays) {
        return reply.code(400).send({
          error: 'Date range cannot exceed 7 days'
        });
      }

      const records = await prisma.priceRecord.findMany({
        where: {
          timestamp: {
            gte: start,
            lte: end
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });
      
      return reply.send({
        success: true,
        data: records,
        count: records.length,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[CronController] Error fetching price history:', errorMessage);
      
      return reply.code(500).send({
        error: 'Failed to fetch price history',
        message: errorMessage
      });
    }
  });
}
