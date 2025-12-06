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

const simpleWithContextFormat = format.printf(
  ({
    level,
    message,
    timestamp,
    requestId,
    apiKey,
    userId,
    userAgent,
    stack,
  }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (requestId) log += ` [requestId: ${requestId}]`;
    if (apiKey) log += ` [apiKey: ${apiKey}]`;
    if (userId) log += ` [userId: ${userId}]`;
    if (userAgent) log += ` [userAgent: ${userAgent}]`;
    if (stack)
      log += `
${stack}`; // Include stack for errors
    return log;
  }
);

const logger = createLogger({
  level: 'info',
  format: format.combine(
    requestContextFormat(),
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    isDevelopment || isPrettyLog ? simpleWithContextFormat : format.json()
  ),
  transports: [
    new transports.Console({
      format:
        isDevelopment || isPrettyLog
          ? format.combine(format.colorize(), simpleWithContextFormat)
          : format.json(),
    }),
  ],
});

export default logger;
