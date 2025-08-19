# API Key Update/Rename

This document describes the API key update/rename functionality 

## Overview

The API key update endpoint allows users to rename their existing API keys following RESTful patterns. This is the second of four planned improvements to the API key management system.

## Endpoint

```
PUT /api/v1/keys/update/:id
```

## Request Format

### Headers
- `Content-Type: application/json`

### Body
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "name": "New API Key Name"
}
```

### Parameters
- `id` (path parameter): The UUID of the API key to update (e.g., `/api/v1/keys/update/123e4567-e89b-12d3-a456-426614174000`)

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "message": "API key updated successfully",
    "apiKey": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "New API Key Name",
      "updatedAt": "2025-01-13T16:18:15.123Z"
    }
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

## Validation Rules

The API key name must meet these requirements:
- **Required**: Cannot be empty
- **Length**: Maximum 100 characters
- **Type**: Must be a string

## Security Features

1. **Authentication Required**: Users must provide valid email and password
2. **Authorization Check**: Users can only update their own API keys
3. **Input Validation**: All inputs are validated using Zod schemas
4. **UUID Validation**: API key ID must be a valid UUID format

## Implementation Details

### Controller Changes
- Added `PUT /update/:id` endpoint to `apiKeyController.ts`
- Implemented proper validation using Zod schemas
- Added user authentication and authorization checks
- Implemented proper error handling and responses

### Schema Updates
- Added `updateApiKeyRequestSchema` for request validation
- Added `UpdateApiKeyRequest` type
- Added `UpdateApiKeyResponse` interface

### Database Operations
- Uses Prisma to safely update API key names
- Verifies ownership before updating
- Automatically updates the `updatedAt` timestamp
- Returns appropriate error messages for various failure scenarios

### Database Schema Changes
- Added `updatedAt` field to the `ApiKey` model
- Migration handles existing records by setting `updatedAt` to `createdAt` initially
- Future updates will automatically track modification timestamps



## Migration Notes

A database migration was required to add the `updatedAt` field:
- Migration: `20250813161815_add_updated_at_to_api_keys`
- Existing API keys will have `updatedAt` set to their `createdAt` timestamp
- Future updates will automatically track modification times

## Rate Limiting

The update endpoint is subject to the same rate limiting as other API key management endpoints:
- Maximum 5 requests per minute per IP address

## Example Workflow

1. **List API keys** to get the ID of the key you want to rename
2. **Update the API key** using the PUT endpoint with the new name
3. **Verify the update** by listing the keys again or checking the response

## Error Handling

The endpoint provides comprehensive error handling:
- **400**: Invalid input (empty name, too long, wrong format)
- **401**: Authentication failed (wrong email/password)
- **404**: API key not found or doesn't belong to user
- **500**: Server error (database issues, etc.)
