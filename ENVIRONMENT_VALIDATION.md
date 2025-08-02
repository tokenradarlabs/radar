# Environment Variable Validation

This document describes the environment variable validation system implemented to address security and reliability concerns.

## Overview

The application now validates all required environment variables at startup to prevent runtime failures and security issues.

## Required Environment Variables

The following environment variables are now **required** and validated at startup:

### 1. `DATABASE_URL`
- **Purpose**: PostgreSQL connection string for Prisma ORM
- **Format**: `postgresql://username:password@host:port/database`
- **Example**: `postgresql://postgres:password@localhost:5432/radar_db`

### 2. `JWT_SECRET`
- **Purpose**: Secret key for JWT token signing and verification
- **Security**: Must be a strong, random string (32+ characters recommended)
- **Important**: The default fallback `'your-secret-key'` is no longer accepted and will cause a startup error

### 3. `ANKR_API_KEY`
- **Purpose**: API key for Ankr RPC service to access Base network
- **Usage**: Required for Uniswap V3 price fetching in `uniswapPrice.ts`
- **Obtain**: Get your API key from [Ankr Dashboard](https://www.ankr.com/rpc/)

### 4. `COINGECKO_API_KEY`
- **Purpose**: API key for CoinGecko price and volume data
- **Usage**: Used across multiple price/volume utilities
- **Obtain**: Get your API key from [CoinGecko API](https://www.coingecko.com/en/api)

## Optional Environment Variables

### 1. `FASTIFY_PORT`
- **Purpose**: Port number for the Fastify server
- **Default**: 3006
- **Type**: Number

### 2. `NODE_ENV`
- **Purpose**: Application environment mode
- **Values**: `development`, `production`, `test`
- **Default**: No default value

## Implementation Details

### Validation System

The validation is implemented in `src/utils/envValidation.ts` with two main functions:

1. **`validateEnvironmentVariables()`**: Validates all required variables at startup
2. **`getValidatedEnv()`**: Returns typed environment variables after validation

### Startup Validation

The application validates environment variables in `src/index.ts` before starting the server:

```typescript
try {
  validateEnvironmentVariables();
  console.log("✅ Environment variables validated successfully");
} catch (error) {
  console.error("❌ Environment validation failed:", error.message);
  process.exit(1);
}
```

### Security Improvements

1. **Removed insecure JWT fallback**: The hardcoded `'your-secret-key'` fallback has been removed
2. **Explicit security check**: The system explicitly rejects the insecure default JWT secret
3. **Centralized validation**: All environment variable access goes through validated functions

### Files Modified

- `src/index.ts`: Added startup validation
- `src/utils/auth.ts`: Removed insecure JWT_SECRET fallback
- `src/utils/uniswapPrice.ts`: Added ANKR_API_KEY validation
- `src/utils/coinGeckoPrice.ts`: Updated to use validated COINGECKO_API_KEY
- `src/utils/coinGeckoPriceChange.ts`: Updated to use validated COINGECKO_API_KEY
- `src/utils/coinGeckoVolume.ts`: Updated to use validated COINGECKO_API_KEY
- `.env.example`: Updated with all required variables and documentation

## Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update all the placeholder values in `.env` with your actual credentials:
   - Set a strong `JWT_SECRET`
   - Add your `ANKR_API_KEY`
   - Add your `COINGECKO_API_KEY`
   - Configure your `DATABASE_URL`

3. Start the application:
   ```bash
   npm start
   ```

If any required environment variables are missing or invalid, the application will exit with a clear error message.

## Error Messages

The validation system provides clear error messages:

- **Missing variables**: "Missing required environment variables: VAR1, VAR2"
- **Empty variables**: "Environment variables cannot be empty: VAR1, VAR2"
- **Insecure JWT**: "Security Error: JWT_SECRET is set to the default insecure value"

## Benefits

1. **Early failure detection**: Issues are caught at startup rather than runtime
2. **Improved security**: Eliminates insecure fallbacks and default values
3. **Better developer experience**: Clear error messages and documentation
4. **Type safety**: All environment variables are properly typed
5. **Centralized management**: Single source of truth for environment configuration
