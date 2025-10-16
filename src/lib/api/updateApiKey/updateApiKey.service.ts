import bcrypt from 'bcrypt';
import { prisma } from '../../../utils/prisma';
import { UpdateApiKeyRequest } from './updateApiKey.schema';

export interface UpdateApiKeyResponse {
  message: string;
  apiKey: {
    id: string;
    name: string;
    updatedAt: Date;
  };
}

export class UpdateApiKeyService {
  static async updateApiKey(
    data: UpdateApiKeyRequest,
    apiKeyId: string
  ): Promise<UpdateApiKeyResponse> {
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if the API key exists and belongs to the user
    const existingApiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        userId: user.id,
      },
    });

    if (!existingApiKey) {
      throw new Error('API key not found or access denied');
    }

    const updatedApiKey = await prisma.apiKey.update({
      where: {
        id: apiKeyId,
      },
      data: {
        name: data.name,
      },
    });

    return {
      message: 'API key updated successfully',
      apiKey: {
        id: updatedApiKey.id,
        name: updatedApiKey.name,
        updatedAt: updatedApiKey.updatedAt,
      },
    };
  }
}
