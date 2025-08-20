import bcrypt from "bcrypt";
import { prisma } from '../../../utils/prisma';
import { GetUsageAnalyticsRequest } from './getUsageAnalytics.schema';

export interface UsageAnalyticsResponse {
  totalApiKeys: number;
  totalUsage: number;
  activeApiKeys: number;
  inactiveApiKeys: number;
  mostUsedApiKey: {
    id: string;
    name: string;
    usageCount: number;
    lastUsedAt: Date;
  } | null;
  leastUsedApiKey: {
    id: string;
    name: string;
    usageCount: number;
    lastUsedAt: Date;
  } | null;
  averageUsagePerKey: number;
  apiKeyDetails: Array<{
    id: string;
    name: string;
    usageCount: number;
    lastUsedAt: Date;
    isActive: boolean;
    createdAt: Date;
  }>;
}

export class GetUsageAnalyticsService {
  static async getUsageAnalytics(data: GetUsageAnalyticsRequest): Promise<UsageAnalyticsResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: data.email
      }
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Compare password with hashed password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Build where clause for API keys
    const whereClause: any = {
      userId: user.id
    };

    // If specific API key ID is provided, filter by it
    if (data.apiKeyId) {
      whereClause.id = data.apiKeyId;
    }

    // Get all API keys for the user with usage data
    const apiKeys = await prisma.apiKey.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        usageCount: true,
        lastUsedAt: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        usageCount: 'desc'
      }
    });

    if (apiKeys.length === 0) {
      throw new Error("No API keys found");
    }

    // Calculate analytics
    const totalApiKeys = apiKeys.length;
    const totalUsage = apiKeys.reduce((sum, key) => sum + key.usageCount, 0);
    const activeApiKeys = apiKeys.filter(key => key.isActive).length;
    const inactiveApiKeys = totalApiKeys - activeApiKeys;
    const averageUsagePerKey = totalUsage / totalApiKeys;

    // Find most and least used API keys
    const mostUsedApiKey = apiKeys[0]; // Already sorted by usage count desc
    const leastUsedApiKey = apiKeys[apiKeys.length - 1];

    return {
      totalApiKeys,
      totalUsage,
      activeApiKeys,
      inactiveApiKeys,
      mostUsedApiKey: {
        id: mostUsedApiKey.id,
        name: mostUsedApiKey.name,
        usageCount: mostUsedApiKey.usageCount,
        lastUsedAt: mostUsedApiKey.lastUsedAt
      },
      leastUsedApiKey: {
        id: leastUsedApiKey.id,
        name: leastUsedApiKey.name,
        usageCount: leastUsedApiKey.usageCount,
        lastUsedAt: leastUsedApiKey.lastUsedAt
      },
      averageUsagePerKey: Math.round(averageUsagePerKey * 100) / 100, // Round to 2 decimal places
      apiKeyDetails: apiKeys
    };
  }
}
