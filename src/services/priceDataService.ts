import { PrismaClient } from '@prisma/client';
import { PriceData } from '../types/price';

export class PriceDataService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Store price data in the database
   */
  async storePriceData(priceData: PriceData): Promise<void> {
    try {
      await this.prisma.priceRecord.create({
        data: {
          timestamp: priceData.timestamp,
          btcPrice: priceData.btcPrice,
          ethPrice: priceData.ethPrice,
          devPrice: priceData.devPrice,
          btcSource: priceData.btcSource,
          ethSource: priceData.ethSource,
          devSource: priceData.devSource,
        }
      });

      console.log(`[PriceDataService] Successfully stored price data for ${priceData.timestamp.toISOString()}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[PriceDataService] Error storing price data:', errorMessage);
      throw error;
    }
  }

  /**
   * Get the latest stored price records
   */
  async getLatestPrices(limit: number = 10): Promise<any[]> {
    try {
      const records = await this.prisma.priceRecord.findMany({
        orderBy: {
          timestamp: 'desc'
        },
        take: limit
      });

      return records;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[PriceDataService] Error fetching latest prices:', errorMessage);
      throw error;
    }
  }

  /**
   * Clean up old price records (older than 30 days)
   */
  async cleanupOldRecords(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.priceRecord.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo
          }
        }
      });

      const deletedCount = result.count;
      if (deletedCount > 0) {
        console.log(`[PriceDataService] Cleaned up ${deletedCount} old price records`);
      }

      return deletedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[PriceDataService] Error cleaning up old records:', errorMessage);
      throw error;
    }
  }

  /**
   * Get price records within a date range
   */
  async getPriceHistory(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const records = await this.prisma.priceRecord.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      return records;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[PriceDataService] Error fetching price history:', errorMessage);
      throw error;
    }
  }

  /**
   * Get statistics about stored price data
   */
  async getPriceStatistics(): Promise<{
    totalRecords: number;
    oldestRecord?: Date;
    latestRecord?: Date;
  }> {
    try {
      const [totalCount, oldestRecord, latestRecord] = await Promise.all([
        this.prisma.priceRecord.count(),
        this.prisma.priceRecord.findFirst({
          orderBy: { timestamp: 'asc' },
          select: { timestamp: true }
        }),
        this.prisma.priceRecord.findFirst({
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true }
        })
      ]);

      return {
        totalRecords: totalCount,
        oldestRecord: oldestRecord?.timestamp,
        latestRecord: latestRecord?.timestamp
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[PriceDataService] Error fetching price statistics:', errorMessage);
      throw error;
    }
  }
}
