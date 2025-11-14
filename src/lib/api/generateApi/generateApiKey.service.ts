import type { ApiKeyRequest } from './generateApiKey.schema';
import crypto from 'crypto';
import { prisma } from '../../../utils/prisma';
import bcrypt from 'bcrypt';
import { ConflictError, UnauthorizedError } from '../../../utils/errors';
import { PrismaClientKnownRequestError } from '@prisma/client';

export interface ApiKeyResponse {
  apiKey: string;
}

function generateApiKey(): string {
  return `rdr_${crypto.randomBytes(64).toString('hex')}`;
}

async function generateUniqueKeyName(userId: string): Promise<string> {
  let counter = 0;
  let newName: string;
  let isUnique = false;

  const MAX_ATTEMPTS = 100;
  do {
    newName = `API Key - ${new Date().toISOString().slice(0, 10)}${counter > 0 ? ` (${counter})` : ''}`;
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        userId: userId,
        name: newName,
      },
    });
    if (!existingKey) {
      isUnique = true;
    } else {
      counter++;
    }
    if (counter >= MAX_ATTEMPTS) {
      throw new Error('Failed to generate a unique API key name after multiple attempts.');
    }
  } while (!isUnique);

  return newName;
}

export class GenerateApiKeyService {
  static async generateApiKey(data: ApiKeyRequest): Promise<ApiKeyResponse> {
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    let apiKeyName: string;
    if (data.name) {
      const existingKey = await prisma.apiKey.findFirst({
        where: {
          userId: user.id,
          name: data.name,
        },
      });

      if (existingKey) {
        throw new ConflictError('API key with this name already exists for this user.');
      }
      apiKeyName = data.name;
    } else {
      apiKeyName = await generateUniqueKeyName(user.id);
    }

    const apiKey = generateApiKey();
    let expiresAt: Date | undefined;
    if (data.expirationDuration) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expirationDuration);
    }

    const { scopes, rateLimit } = data;

    try {
      const newApiKey = await prisma.apiKey.create({
        data: {
          key: apiKey,
          name: apiKeyName,
          userId: user.id,
          expiresAt: expiresAt,
          scopes: scopes || [],
          rateLimit: rateLimit || 1000,
        },
      });

      return {
        apiKey: newApiKey.key,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('API key with this name already exists for this user.');
      }
      throw error;
    }
  }
}
