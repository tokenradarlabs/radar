import logger from './logger';

const ENABLE_TELEMETRY = process.env.ENABLE_TELEMETRY === 'true';

export const telemetry = {
  recordDuration: (
    eventName: string,
    durationMs: number,
    tags?: Record<string, string | number>
  ) => {
    if (ENABLE_TELEMETRY) {
      logger.info({
        type: 'telemetry',
        event: eventName,
        metric: 'duration',
        value: durationMs,
        unit: 'ms',
        ...tags,
      });
    }
  },

  recordCount: (
    eventName: string,
    count: number = 1,
    tags?: Record<string, string | number>
  ) => {
    if (ENABLE_TELEMETRY) {
      logger.info({
        type: 'telemetry',
        event: eventName,
        metric: 'count',
        value: count,
        unit: 'count',
        ...tags,
      });
    }
  },
};
