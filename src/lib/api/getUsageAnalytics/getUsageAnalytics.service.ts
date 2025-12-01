import { prisma } from '../../../utils/prisma';
import {
  GetDetailedUsageAnalyticsRequest,
  UsageAnalyticsResponse,
} from './getUsageAnalytics.schema';
import { getDateFormatOptions, getFirstDayOfWeek, addDays, addMonths } from '../../../utils/date';

export class GetUsageAnalyticsService {
  static async getUsageAnalytics(
    userId: string,
    data: GetDetailedUsageAnalyticsRequest
  ): Promise<UsageAnalyticsResponse> {
    const { apiKeyId, startDate, endDate, interval } = data;

    const whereClause: any = {
      apiKey: {
        userId: userId,
      },
    };

    if (apiKeyId) {
      whereClause.apiKeyId = apiKeyId;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const totalRequests = await prisma.usageLog.count({
      where: whereClause,
    });

    const averageResponseTimeResult = await prisma.usageLog.aggregate({
      _avg: {
        response_time_ms: true,
      },
      where: whereClause,
    });

    const errorRequests = await prisma.usageLog.count({
      where: {
        ...whereClause,
        status_code: { gte: 400 },
      },
    });

    const errorRate =
      totalRequests === 0 ? 0 : (errorRequests / totalRequests) * 100;

    const popularEndpoints = await prisma.usageLog.groupBy({
      by: ['endpoint'],
      _count: {
        id: true,
      },
      where: whereClause,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    let timeSeries:
      | Array<{
          date: string;
          requests: number;
          errors: number;
          averageResponseTime: number;
        }>
      | undefined = undefined;

    if (interval && startDate && endDate) {
      timeSeries = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      const dateFormat = getDateFormatOptions(interval);

      const logs = await prisma.usageLog.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'asc',
        },
      });

      const groupedLogs: Record<
        string,
        {
          requests: number;
          errors: number;
          totalResponseTime: number;
          count: number;
        }
      > = logs.reduce(
        (acc, log) => {
          let dateKey;
          const logDate = new Date(log.createdAt);

          if (interval === 'weekly') {
            const firstDayOfWeek = getFirstDayOfWeek(logDate);
            dateKey = firstDayOfWeek.toLocaleDateString('en-CA', dateFormat);
          } else if (interval === 'monthly') {
            dateKey = logDate.toLocaleDateString('en-CA', dateFormat);
          } else {
            dateKey = logDate.toLocaleDateString('en-CA', dateFormat);
          }

          if (!acc[dateKey]) {
            acc[dateKey] = {
              requests: 0,
              errors: 0,
              totalResponseTime: 0,
              count: 0,
            };
          }
          acc[dateKey].requests++;
          if (log.status_code >= 400) {
            acc[dateKey].errors++;
          }
          acc[dateKey].totalResponseTime += log.response_time_ms;
          acc[dateKey].count++;
          return acc;
        },
        {} as Record<
          string,
          {
            requests: number;
            errors: number;
            totalResponseTime: number;
            count: number;
          }
        >
      );

      for (let d = new Date(start); d <= end; ) {
        let dateKey;
        if (interval === 'weekly') {
          const firstDayOfWeek = getFirstDayOfWeek(d);
          dateKey = firstDayOfWeek.toLocaleDateString('en-CA', dateFormat);
        } else if (interval === 'monthly') {
          dateKey = d.toLocaleDateString('en-CA', dateFormat);
        } else {
          dateKey = d.toLocaleDateString('en-CA', dateFormat);
        }

        const dataForDate = groupedLogs[dateKey] || {
          requests: 0,
          errors: 0,
          totalResponseTime: 0,
          count: 0,
        };
        timeSeries.push({
          date: dateKey,
          requests: dataForDate.requests,
          errors: dataForDate.errors,
          averageResponseTime:
            dataForDate.count > 0
              ? dataForDate.totalResponseTime / dataForDate.count
              : 0,
        });

        if (interval === 'daily') {
          d = addDays(d, 1);
        } else if (interval === 'weekly') {
          d = addDays(d, 7);
        } else if (interval === 'monthly') {
          d = addMonths(d, 1);
        }
      }
    }

    return {
      totalRequests,
      averageResponseTime: averageResponseTimeResult._avg.response_time_ms || 0,
      errorRate,
      popularEndpoints: popularEndpoints.map((ep) => ({
        endpoint: ep.endpoint,
        count: ep._count.id,
      })),
      timeSeries,
    };
  }
}
