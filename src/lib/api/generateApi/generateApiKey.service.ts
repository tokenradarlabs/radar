export interface ApiKeyRequest {
  email: string;
  password: string;
  expirationDuration?: number; // Optional duration in days
}

export interface ApiKeyResponse {
  apiKey: string;
}

function generateApiKey(): string {
  return `rdr_${crypto.randomBytes(64).toString('hex')}`;
}

function generateKeyName(): string {
  return `API Key - ${new Date().toISOString()}`;
}

export class GenerateApiKeyService {
  static async generateApiKey(data: ApiKeyRequest): Promise<ApiKeyResponse> {
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

    const apiKey = generateApiKey();
    let expiresAt: Date | undefined;
    if (data.expirationDuration) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expirationDuration);
    }

    const newApiKey = await prisma.apiKey.create({
      data: {
        key: apiKey,
        name: generateKeyName(),
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    return {
      apiKey: newApiKey.key,
    };
  }
}
