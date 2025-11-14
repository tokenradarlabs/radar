import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration: Setting default scopes for existing API keys...');

  const updatedApiKeys = await prisma.apiKey.updateMany({
    where: {
      scopes: null, // Find API keys where scopes is null
    },
    data: {
      scopes: [], // Set scopes to an empty JSON array
    },
  });

  console.log(`Updated ${updatedApiKeys.count} API keys with default scopes.`);

  // Also ensure rateLimit and expiresAt have default values if they are null
  const updatedRateLimits = await prisma.apiKey.updateMany({
    where: {
      rateLimit: null,
    },
    data: {
      rateLimit: 1000, // Default rate limit
    },
  });
  console.log(`Updated ${updatedRateLimits.count} API keys with default rateLimit.`);

  // For expiresAt, if it's null, it means no expiration, which is the default behavior.
  // So, no specific data migration is needed for expiresAt if it's already nullable in schema.

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
