import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from '../../../utils/prisma';
import { ApiKeyRequest } from './generateApiKey.schema';

export interface ApiKeyResponse {
  apiKey: string;
}

function generateApiKey(): string {
  return `rdr_${crypto.randomBytes(32).toString('hex')}`;
}

function generateKeyName(): string {
  return `API Key - ${new Date().toISOString()}`;
}

export class GenerateApiKeyService {
  static async generateApiKey(data: ApiKeyRequest): Promise<ApiKeyResponse> {
    const user = await prisma.user.findUnique({
      where: {
        email: data.email
      }
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const apiKey = generateApiKey();
    const newApiKey = await prisma.apiKey.create({
      data: {
        key: apiKey,
        name: generateKeyName(),
        userId: user.id
      }
    });

    return {
      apiKey: newApiKey.key
    };
  }
}
