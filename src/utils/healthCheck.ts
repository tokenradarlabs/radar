import { PrismaClient } from '@prisma/client';
import { fetchWithRetry } from './fetchWithRetry';
import { getCoinGeckoPrice } from './coinGeckoPrice';

const prisma = new PrismaClient();

interface HealthCheckResult {
  status: 'up' | 'down' | 'degraded';
  timestamp: string;
  responseTime?: number;
  message?: string;
  details?: any;
}

interface DetailedHealthCheckResult {
  overallStatus: 'up' | 'down' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    database: HealthCheckResult;
    coinGecko: HealthCheckResult;
    ankrRpc: HealthCheckResult;
    memoryUsage: HealthCheckResult;
  };
}

const HEALTH_CHECK_TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10); // Default to 5 seconds

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const end = Date.now();
    return { status: 'up', timestamp: new Date().toISOString(), responseTime: end - start };
  } catch (error: any) {
    const end = Date.now();
    return { status: 'down', timestamp: new Date().toISOString(), responseTime: end - start, message: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

export async function checkCoinGeckoHealth(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Use a lightweight CoinGecko endpoint, e.g., a simple price check for a common coin
    await getCoinGeckoPrice('bitcoin');
    const end = Date.now();
    return { status: 'up', timestamp: new Date().toISOString(), responseTime: end - start };
  } catch (error: any) {
    const end = Date.now();
    return { status: 'down', timestamp: new Date().toISOString(), responseTime: end - start, message: error.message };
  }
}

export async function checkAnkrRpcHealth(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const ANKR_API_KEY = process.env.ANKR_API_KEY;
    if (!ANKR_API_KEY) {
      return { status: 'degraded', timestamp: new Date().toISOString(), message: 'ANKR_API_KEY is not configured.' };
    }
    const ANKR_RPC_URL = `https://rpc.ankr.com/base/${ANKR_API_KEY}`;

    // Perform a simple RPC call, e.g., eth_blockNumber
    const response = await fetchWithRetry(ANKR_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    }, HEALTH_CHECK_TIMEOUT);

    if (!response.ok) {
      throw new Error(`Ankr RPC responded with status ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(`Ankr RPC error: ${data.error.message}`);
    }
    const end = Date.now();
    return { status: 'up', timestamp: new Date().toISOString(), responseTime: end - start };
  } catch (error: any) {
    const end = Date.now();
    return { status: 'down', timestamp: new Date().toISOString(), responseTime: end - start, message: error.message };
  }
}

export async function checkMemoryUsage(): Promise<HealthCheckResult> {
  const memoryData = process.memoryUsage();
  const totalMemory = memoryData.rss / (1024 * 1024); // Resident Set Size in MB
  const heapUsed = memoryData.heapUsed / (1024 * 1024); // Heap Used in MB
  const heapTotal = memoryData.heapTotal / (1024 * 1024); // Heap Total in MB

  return {
    status: 'up',
    timestamp: new Date().toISOString(),
    details: {
      rss: `${totalMemory.toFixed(2)} MB`,
      heapUsed: `${heapUsed.toFixed(2)} MB`,
      heapTotal: `${heapTotal.toFixed(2)} MB`,
    },
  };
}

export async function getDetailedHealth(version: string): Promise<DetailedHealthCheckResult> {
  const [database, coinGecko, ankrRpc, memoryUsage] = await Promise.all([
    checkDatabaseHealth(),
    checkCoinGeckoHealth(),
    checkAnkrRpcHealth(),
    checkMemoryUsage(),
  ]);

  const overallStatus: 'up' | 'down' | 'degraded' =
    database.status === 'down' || coinGecko.status === 'down' || ankrRpc.status === 'down'
      ? 'down'
      : database.status === 'degraded' || coinGecko.status === 'degraded' || ankrRpc.status === 'degraded'
      ? 'degraded'
      : 'up';

  return {
    overallStatus,
    timestamp: new Date().toISOString(),
    version,
    checks: {
      database,
      coinGecko,
      ankrRpc,
      memoryUsage,
    },
  };
}
