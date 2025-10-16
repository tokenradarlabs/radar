import { prisma } from './prisma';

// Best-effort detection of database unavailability conditions
export function isDatabaseUnavailableError(error: unknown): boolean {
  const asAny = error as any;
  const code = asAny?.code as string | undefined;
  const message = (asAny?.message as string | undefined)?.toLowerCase() ?? '';

  const connectivityCodes = new Set([
    'P1001', // Can't reach database server
    'P1002', // Connection timed out
    'P1017', // Server closed the connection
    'ETIMEDOUT',
    'ECONNREFUSED',
  ]);

  if (code && connectivityCodes.has(code)) return true;

  // Heuristic message checks
  if (
    message.includes("can't reach database") ||
    message.includes('connect econnrefused') ||
    message.includes('connection timed out') ||
    message.includes('connection terminated') ||
    message.includes('socket hang up') ||
    message.includes('no such host')
  ) {
    return true;
  }

  return false;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Lightweight connectivity probe
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}
