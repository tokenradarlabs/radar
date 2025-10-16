import { createLogger, format, transports } from 'winston';

const isDevelopment = process.env.NODE_ENV === 'development';
const isPrettyLog = process.env.LOG_PRETTY === 'true';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    isDevelopment || isPrettyLog ? format.simple() : format.json()
  ),
  transports: [
    new transports.Console({
      format:
        isDevelopment || isPrettyLog
          ? format.combine(format.colorize(), format.simple())
          : format.json(),
    }),
  ],
});

export default logger;
