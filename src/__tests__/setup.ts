import { beforeAll, afterAll } from 'vitest';

// Load test environment variables

beforeAll(async () => {
  // Global test setup
  // You can set up test database, mock services, etc.
  console.log('🧪 Setting up tests...');
});

afterAll(async () => {
  // Global test cleanup
  console.log('🧹 Cleaning up tests...');
});
