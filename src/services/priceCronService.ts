import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { PriceAggregator } from './priceAggregator';
import { PriceDataService } from './priceDataService';

export class PriceCronService {
  private priceAggregator: PriceAggregator;
  private priceDataService: PriceDataService;
  private cronJob: cron.ScheduledTask | null = null;
  private cleanupJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(prisma: PrismaClient) {
    this.priceAggregator = new PriceAggregator();
    this.priceDataService = new PriceDataService(prisma);
  }

  /**
   * Start the cron job to collect prices every minute
   */
  start(): void {
    if (this.isRunning) {
      console.log('[PriceCronService] Cron service is already running');
      return;
    }

    // Main price collection job - every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.collectAndStorePrices();
    }, {
      timezone: 'UTC'
    });

    // Cleanup job - daily at 2 AM UTC
    this.cleanupJob = cron.schedule('0 2 * * *', async () => {
      await this.performCleanup();
    }, {
      timezone: 'UTC'
    });
    this.isRunning = true;

    console.log('[PriceCronService] Price collection cron job started (every minute)');
    console.log('[PriceCronService] Daily cleanup job started (2 AM UTC)');
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('[PriceCronService] Cron service is not running');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    if (this.cleanupJob) {
      this.cleanupJob.stop();
      this.cleanupJob = null;
    }

    this.isRunning = false;
    console.log('[PriceCronService] All cron jobs stopped');
  }

  /**
   * Check if the cron service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Manually trigger price collection (useful for testing)
   */
  async triggerCollection(): Promise<void> {
    console.log('[PriceCronService] Manually triggered price collection');
    await this.collectAndStorePrices();
  }

  /**
   * Manually trigger cleanup (useful for testing)
   */
  async triggerCleanup(): Promise<void> {
    console.log('[PriceCronService] Manually triggered cleanup');
    await this.performCleanup();
  }

  /**
   * Get service status and statistics
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    statistics?: any;
    nextScheduledRun?: string;
  }> {
    const status: any = {
      isRunning: this.isRunning
    };

    try {
      // Get database statistics
      status.statistics = await this.priceDataService.getPriceStatistics();
      
      // Calculate next run time (next minute)
      const nextRun = new Date();
      nextRun.setMinutes(nextRun.getMinutes() + 1);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      status.nextScheduledRun = nextRun.toISOString();

    } catch (error) {
      console.error('[PriceCronService] Error getting status:', error);
    }

    return status;
  }

  /**
   * Private method to collect and store prices
   */
  private async collectAndStorePrices(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('[PriceCronService] Starting price collection...');
      
      // Fetch prices from all sources
      const result = await this.priceAggregator.fetchAllPrices();
      
      if (!result.success || !result.data) {
        console.error('[PriceCronService] Failed to fetch prices:', result.error);
        return;
      }

      // Store prices in database
      await this.priceDataService.storePriceData(result.data);
      
      const duration = Date.now() - startTime;
      console.log(`[PriceCronService] Price collection completed in ${duration}ms`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[PriceCronService] Error during price collection:', errorMessage);
    }
  }

  /**
   * Private method to perform database cleanup
   */
  private async performCleanup(): Promise<void> {
    try {
      console.log('[PriceCronService] Starting database cleanup...');
      
      const deletedCount = await this.priceDataService.cleanupOldRecords();
      
      if (deletedCount > 0) {
        console.log(`[PriceCronService] Database cleanup completed: ${deletedCount} records deleted`);
      } else {
        console.log('[PriceCronService] Database cleanup completed: no old records to delete');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[PriceCronService] Error during database cleanup:', errorMessage);
    }
  }
}

// Singleton instance for global access
let cronServiceInstance: PriceCronService | null = null;

/**
 * Initialize the cron service singleton
 */
export function initializeCronService(prisma: PrismaClient): PriceCronService {
  if (!cronServiceInstance) {
    cronServiceInstance = new PriceCronService(prisma);
  }
  return cronServiceInstance;
}

/**
 * Get the cron service instance
 */
export function getCronService(): PriceCronService | null {
  return cronServiceInstance;
}
