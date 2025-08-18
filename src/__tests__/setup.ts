import { beforeAll, afterAll } from 'vitest'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

beforeAll(async () => {
  // Global test setup
  // You can set up test database, mock services, etc.
  console.log('🧪 Setting up tests...')
})

afterAll(async () => {
  // Global test cleanup
  console.log('🧹 Cleaning up tests...')
})
