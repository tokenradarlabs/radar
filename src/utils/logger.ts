import { createLogger, format, transports } from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage();

const isDevelopment = process.env.NODE_ENV === 'development';
const isPrettyLog = process.env.LOG_PRETTY === 'true';

const requestContextFormat = format((info) => {
  const store = asyncLocalStorage.getStore() as Map<string, any>;
  if (store) {
    info.requestId = store.get('requestId');
    info.apiKey = store.get('apiKey');
    info.userId = store.get('userId');
    info.userAgent = store.get('userAgent');
  }
  return info;
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    requestContextFormat(),
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
