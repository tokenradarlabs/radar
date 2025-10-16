import bcrypt from 'bcrypt';
import { prisma } from '../../../utils/prisma';
import { DeleteApiKeyRequest } from './deleteApiKey.schema';

export interface DeleteApiKeyResponse {
  message: string;
}

export class DeleteApiKeyService {
  static async deleteApiKey(
    data: DeleteApiKeyRequest
  ): Promise<DeleteApiKeyResponse> {
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
        id: data.apiKeyId,
        userId: user.id,
      },
    });

    if (!existingApiKey) {
      throw new Error('API key not found or access denied');
    }

    await prisma.apiKey.delete({
      where: {
        id: data.apiKeyId,
      },
    });

    return {
      message: 'API key deleted successfully',
    };
  }
}
