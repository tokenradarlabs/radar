# API Response Standardization

This document describes the standardized response format implemented across all API endpoints to ensure consistency.

## Overview

All API endpoints now return responses in a consistent format using the `Response<T>` type and standardized helper functions.

## Response Format

### Success Response

```typescript
{
  success: true,
  data: T  // The actual response data
}
```

### Error Response

```typescript
{
  success: false,
  error: string  // Error message
}
```

## HTTP Status Codes

The API uses standard HTTP status codes:

- `200` - OK (successful GET requests)
- `201` - Created (successful POST requests)
- `400` - Bad Request (validation errors, malformed requests)
- `401` - Unauthorized (authentication required or invalid)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error (server-side errors)

## Response Helper Functions

All controllers use standardized helper functions from `src/utils/responseHelper.ts`:

### Success Responses

- `sendSuccess<T>(reply, data, statusCode?)` - Sends success response with data
- Default status code is 200, can be overridden (e.g., 201 for creation)

### Error Responses

- `sendError(reply, error, statusCode)` - Generic error response
- `sendBadRequest(reply, error)` - 400 Bad Request
- `sendUnauthorized(reply, error?)` - 401 Unauthorized
- `sendNotFound(reply, error)` - 404 Not Found
- `sendInternalError(reply, error?)` - 500 Internal Server Error

## Updated Controllers

The following controllers have been standardized:

### Price Controller (`priceController.ts`)

- **Endpoint**: `GET /api/v1/price/:tokenId`
- **Success Response**:
  ```typescript
  {
    success: true,
    data: {
      price: number,
      tokenId: string
    }
  }
  ```

### Volume Controller (`volumeController.ts`)

- **Endpoint**: `GET /api/v1/volume/:tokenId`
- **Success Response**:
  ```typescript
  {
    success: true,
    data: {
      volume: number,
      tokenId: string,
      period: "24h"
    }
  }
  ```

### Price Change Controller (`priceChangeController.ts`)

- **Endpoint**: `GET /api/v1/priceChange/:tokenId`
- **Success Response**:
  ```typescript
  {
    success: true,
    data: {
      priceChange: number,
      tokenId: string,
      period: "24h"
    }
  }
  ```

### DEV Price Controller (`devPriceController.ts`)

- **Endpoint**: `GET /api/v1/dev/price`
- **Success Response**:
  ```typescript
  {
    success: true,
    data: {
      price: number,
      token: "scout-protocol-token",
      symbol: "DEV"
    }
  }
  ```

## Error Handling

All controllers now have consistent error handling:

1. **Validation Errors**: Return 400 Bad Request with descriptive error message
2. **Not Found**: Return 404 Not Found when data is unavailable
3. **Server Errors**: Return 500 Internal Server Error for unexpected errors
4. **Authentication Errors**: Return 401 Unauthorized for auth failures

## Benefits

1. **Consistency**: All endpoints follow the same response structure
2. **Type Safety**: Using TypeScript interfaces ensures response structure
3. **Maintainability**: Centralized response handling makes updates easier
4. **Developer Experience**: Predictable response format for API consumers
5. **Error Clarity**: Standardized error messages and status codes

## Migration Notes

- Removed inconsistent response formats (e.g., `{ price: number }` → `{ success: true, data: { price: number } }`)
- Standardized HTTP status code usage (`reply.status()` consistently)
- Added proper error logging in all controllers
- Enhanced response data with additional context (tokenId, period, etc.)
