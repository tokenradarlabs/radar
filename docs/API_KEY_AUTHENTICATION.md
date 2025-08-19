# API Key Authentication

This document explains how API key authentication works for the Radar API endpoints.

## Overview

The following endpoints now require API key authentication:

- `/api/v1/price/:tokenId`
- `/api/v1/priceChange/:tokenId`
- `/api/v1/volume/:tokenId`
- `/api/v1/price/dev/*`

## How to Use API Keys

### 1. Generate an API Key

First, you need to generate an API key by making a POST request to `/api/v1/keys/generate`:

```bash
curl -X POST http://localhost:3006/api/v1/keys/generate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "apiKey": "rdr_1234567890abcdef..."
  }
}
```

### 2. Use the API Key

You can provide the API key in two ways:

#### Option 1: Using the `x-api-key` header (Recommended)

```bash
curl -X GET http://localhost:3006/api/v1/price/btc \
  -H "x-api-key: rdr_1234567890abcdef..."
```

#### Option 2: Using the `api_key` query parameter

```bash
curl -X GET "http://localhost:3006/api/v1/price/btc?api_key=rdr_1234567890abcdef..."
```

### 3. Response Examples

#### Successful Request with Valid API Key:

```json
{
  "success": true,
  "price": 45000.5
}
```

#### Request without API Key:

```json
{
  "success": false,
  "error": "API key required. Provide it in the 'x-api-key' header or 'api_key' query parameter."
}
```

#### Request with Invalid API Key:

```json
{
  "success": false,
  "error": "Invalid or inactive API key"
}
```

## Implementation Details

### Middleware Function

The `authenticateApiKey` middleware:

1. Checks for API key in the `x-api-key` header or `api_key` query parameter
2. Validates the API key against the database
3. Ensures the API key is active
4. Updates the `lastUsedAt` timestamp
5. Attaches API key and user information to the request object

### Database Schema

API keys are stored in the `ApiKey` table with the following fields:

- `id`: Unique identifier
- `key`: The actual API key (format: `rdr_<64_hex_characters>`)
- `name`: Human-readable name for the key
- `createdAt`: When the key was created
- `lastUsedAt`: When the key was last used
- `isActive`: Whether the key is currently active
- `userId`: ID of the user who owns the key

### Security Features

- API keys are prefixed with `rdr_` for easy identification
- Keys are generated using cryptographically secure random bytes
- Each API key usage updates the `lastUsedAt` timestamp for auditing
- Inactive API keys are rejected
- API keys are tied to specific users for accountability

## Endpoints That Don't Require API Keys

The following endpoints remain public:

- `/` (index/health check)
- `/auth/*` (authentication endpoints)
- `/api/v1/keys/*` (API key management endpoints)
- `/user/*` (user management endpoints - these use JWT authentication)

## Rate Limiting

API key management endpoints (`/api/v1/keys/*`) have rate limiting applied:

- Maximum 5 requests per minute per IP address
