import bcrypt from "bcrypt";
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
}

export class GetApiKeysService {
  static async getApiKeys(data: GetApiKeysRequest): Promise<ApiKeyListResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: data.email
      }
    });

    // If user doesn't exist, return error
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Compare password with hashed password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    // If password is invalid, return error
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Fetch API keys for the user
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        key: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
        usageCount: true,
        isActive: true
      }
    });

    return {
      apiKeys
    };
  }
}
