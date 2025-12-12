import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import logger from '../utils/logger';
import { ENV } from '../utils/envValidation';

declare module 'fastify' {
  interface FastifyRequest {
    requestStartTime: bigint;
  }
}

function validateMaxDurations(value: string | undefined): number {
  const parsed = parseInt(value || '', 10);
  if (Number.isFinite(parsed) && parsed > 0 && parsed <= 1000) {
    return parsed;
  }
  return 100; // Safe default
}

function calculatePercentile(sortedDurations: number[], percentile: number): number {
  if (sortedDurations.length === 0) {
    return 0;
  }
  const index = (percentile / 100) * (sortedDurations.length - 1);
  if (index % 1 === 0) {
    return sortedDurations[index];
  }
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedDurations[lower] * (1 - weight) + sortedDurations[upper] * weight;
}

async function requestTimingPlugin(fastify: FastifyInstance) {
  const durations: number[] = [];
  const MAX_DURATIONS = validateMaxDurations(ENV.REQUEST_TIMING_MAX_DURATIONS);

  fastify.addHook(
    'onRequest',
    async (request: FastifyRequest, reply: FastifyReply) => {
      request.requestStartTime = process.hrtime.bigint();
    }
  );

  fastify.addHook(
    'onResponse',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (ENV.ENABLE_REQUEST_TIMING_LOGS) {
        const duration =
          Number(process.hrtime.bigint() - request.requestStartTime) /
          1_000_000; // duration in milliseconds
        durations.push(duration);

        if (durations.length > MAX_DURATIONS) {
          durations.shift(); // Remove the oldest duration if array exceeds limit
        }

        logger.info(
          `Request Timing: ${request.id} - ${request.method} ${request.url} - ${reply.statusCode} - ${duration.toFixed(2)}ms`
        );

        if (durations.length === MAX_DURATIONS) { // Calculate and log percentiles every MAX_DURATIONS requests
          const sortedDurations = [...durations].sort((a, b) => a - b);
          const p50 = calculatePercentile(sortedDurations, 50).toFixed(2);
          const p95 = calculatePercentile(sortedDurations, 95).toFixed(2);
          const p99 = calculatePercentile(sortedDurations, 99).toFixed(2);

          logger.info(`Response Time Percentiles (last ${MAX_DURATIONS} requests): P50=${p50}ms, P95=${p95}ms, P99=${p99}ms`);
          durations.length = 0; // Clear durations after logging percentiles
        }
      }
    }
  );
}

export default fp(requestTimingPlugin);
