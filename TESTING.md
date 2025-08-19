# Testing Guide

This project uses [Vitest](https://vitest.dev/) for testing, a fast and modern testing framework for TypeScript/JavaScript projects.

## Getting Started

### Installation
The testing dependencies are already installed. If you need to reinstall:

```bash
npm install --save-dev vitest @vitest/ui
```

### Running Tests

```bash
# Run tests in watch mode (default)
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Structure

Tests are located in the `src/__tests__/` directory and follow the naming convention `*.test.ts` or `*.spec.ts`.

### Example Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  it('should do something', () => {
    expect(true).toBe(true)
  })
})
```

## Testing Utilities

### Mocking
Vitest provides built-in mocking capabilities:

```typescript
import { vi } from 'vitest'

// Mock a function
const mockFn = vi.fn()

// Mock a module
vi.mock('./module', () => ({
  default: vi.fn()
}))
```

### Testing Fastify Routes
For testing API endpoints, you can use Fastify's testing capabilities:

```typescript
import { describe, it, expect } from 'vitest'
import { build } from '../app'

describe('API Routes', () => {
  it('should return 200 for health check', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    })
    
    expect(response.statusCode).toBe(200)
    app.close()
  })
})
```

## Configuration

The Vitest configuration is located in `vitest.config.ts`:

- **Environment**: Node.js
- **Globals**: Enabled (no need to import `describe`, `it`, `expect`)
- **Coverage**: v8 provider with HTML, JSON, and text reports
- **Setup**: Global setup file at `src/__tests__/setup.ts`

## Environment Variables

For testing, create a `.env.test` file based on `.env.test.example`:

```bash
cp .env.test.example .env.test
```

Update the values in `.env.test` for your test environment.

## Best Practices

1. **Test Structure**: Use `describe` blocks to group related tests
2. **Test Names**: Write descriptive test names that explain what is being tested
3. **Mocking**: Mock external dependencies and database calls
4. **Isolation**: Each test should be independent and not rely on other tests
5. **Coverage**: Aim for good test coverage, especially for critical business logic

## Debugging Tests

To debug tests in VS Code:
1. Set breakpoints in your test files
2. Run the test in debug mode
3. Or use `console.log` statements for simple debugging

## Continuous Integration

Tests will run automatically in CI/CD pipelines. Make sure all tests pass before submitting pull requests.

```bash
# Run tests in CI mode
npm run test:run
```
