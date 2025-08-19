# API Key Deletion

This document describes the API key deletion functionality

## Overview

The API key deletion endpoint allows users to delete their API keys following RESTful patterns. This is the first of four planned improvements to the API key management system.

## Endpoint

```
DELETE /api/v1/keys/delete/:id
```

## Request Format

### Headers
- `Content-Type: application/json`

### Body
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

### Parameters
- `id` (path parameter): The UUID of the API key to delete (e.g., `/api/v1/keys/delete/123e4567-e89b-12d3-a456-426614174000`)

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "message": "API key deleted successfully"
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "API key not found or access denied"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Security Features

1. **Authentication Required**: Users must provide valid email and password
2. **Authorization Check**: Users can only delete their own API keys
3. **Input Validation**: All inputs are validated using Zod schemas
4. **UUID Validation**: API key ID must be a valid UUID format

## Implementation Details

### Controller Changes
- Added `DELETE /:id` endpoint to `apiKeyController.ts`
- Implemented proper validation using Zod schemas
- Added user authentication and authorization checks
- Implemented proper error handling and responses

### Schema Updates
- Added `deleteApiKeyRequestSchema` for request validation
- Added `DeleteApiKeyRequest` type
- Added `DeleteApiKeyResponse` interface

### Database Operations
- Uses Prisma to safely delete API keys
- Verifies ownership before deletion
- Returns appropriate error messages for various failure scenarios


## Migration Notes

No database migrations are required for this feature. The existing `ApiKey` model already has the necessary `id` field for deletion operations.

## Rate Limiting

The deletion endpoint is subject to the same rate limiting as other API key management endpoints:
- Maximum 5 requests per minute per IP address
