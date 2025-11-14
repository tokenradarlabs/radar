import bcrypt from 'bcrypt';
import { prisma } from '../../../utils/prisma';
import { GetApiKeysRequest } from './getApiKeys.schema';

export interface ApiKeyListResponse {
  apiKeys: {
    id: string;
    key: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date;
    usageCount: number;
    isActive: boolean;
  }[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GetApiKeysService {
  static async getApiKeys(
    data: GetApiKeysRequest
  ): Promise<ApiKeyListResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    // If user doesn't exist, return error
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare password with hashed password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    // If password is invalid, return error
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Fetch API keys for the user
    const { page = 1, limit = 10 } = data;
    const skip = (page - 1) * limit;
    const take = limit;

    const [apiKeys, totalCount] = await prisma.$transaction([
      prisma.apiKey.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          key: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          lastUsedAt: true,
          usageCount: true,
          isActive: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      prisma.apiKey.count({
        where: {
          userId: user.id,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      apiKeys,
      totalCount,
      page,
      limit,
      totalPages,
    };
  }
}
