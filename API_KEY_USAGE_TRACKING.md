# API Key Usage Tracking

This document describes the comprehensive API key usage tracking system implemented in the Radar API.

## Overview

The API key usage tracking system provides detailed insights into how API keys are being used, including usage counts, timestamps, and analytics. This helps users monitor their API consumption and identify usage patterns.

## Features Implemented

### 1. Usage Count Tracking
- **Automatic Increment**: Every time an API key is used, the `usageCount` field is automatically incremented
- **Real-time Updates**: Usage counts are updated in real-time during API key authentication
- **Persistent Storage**: Usage counts are stored in the database and persist across server restarts

### 2. Last Used Timestamp
- **Automatic Updates**: The `lastUsedAt` field is automatically updated to the current timestamp on each API key usage
- **Accurate Tracking**: Provides precise information about when each API key was last used
- **Historical Data**: Maintains a complete history of API key usage patterns

### 3. Usage Analytics
- **Comprehensive Statistics**: Detailed analytics including total usage, average usage per key, and key comparisons
- **Most/Least Used Keys**: Identifies the most and least frequently used API keys
- **Active/Inactive Tracking**: Shows the count of active vs. inactive API keys
- **Individual Key Analytics**: Provides detailed analytics for specific API keys

## Database Schema

The API key model has been enhanced with the following fields:

```prisma
model ApiKey {
  id          String   @id @default(uuid())
  key         String   @unique
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastUsedAt  DateTime @default(now())
  usageCount  Int      @default(0)      // NEW: Tracks total usage count
  isActive    Boolean  @default(true)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
}
```

## API Endpoints

### 1. Get API Keys with Usage Data
**Endpoint**: `POST /api/v1/keys/getApiKeys`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "apiKeys": [
      {
        "id": "uuid",
        "key": "rdr_...",
        "name": "API Key Name",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "lastUsedAt": "2024-01-01T12:00:00Z",
        "usageCount": 42,
        "isActive": true
      }
    ]
  }
}
```

### 2. Usage Analytics
**Endpoint**: `POST /api/v1/keys/usageAnalytics`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "apiKeyId": "optional-uuid"  // Optional: Get analytics for specific key
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalApiKeys": 5,
    "totalUsage": 150,
    "activeApiKeys": 4,
    "inactiveApiKeys": 1,
    "mostUsedApiKey": {
      "id": "uuid",
      "name": "Most Used Key",
      "usageCount": 75,
      "lastUsedAt": "2024-01-01T12:00:00Z"
    },
    "leastUsedApiKey": {
      "id": "uuid",
      "name": "Least Used Key",
      "usageCount": 5,
      "lastUsedAt": "2024-01-01T10:00:00Z"
    },
    "averageUsagePerKey": 30.0,
    "apiKeyDetails": [
      {
        "id": "uuid",
        "name": "Key Name",
        "usageCount": 42,
        "lastUsedAt": "2024-01-01T12:00:00Z",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## How It Works

### 1. Automatic Usage Tracking
When an API key is used to access any protected endpoint:

1. The `authenticateApiKey` middleware intercepts the request
2. Validates the API key against the database
3. **Automatically increments the `usageCount` field**
4. **Updates the `lastUsedAt` timestamp to the current time**
5. Allows the request to proceed

### 2. Analytics Calculation
The usage analytics endpoint:

1. Retrieves all API keys for the authenticated user
2. Calculates comprehensive statistics:
   - Total usage across all keys
   - Average usage per key
   - Most and least used keys
   - Active vs. inactive key counts
3. Returns formatted analytics data

### 3. Real-time Updates
- Usage counts are updated immediately when API keys are used
- No caching or delayed updates - all data is real-time
- Analytics are calculated on-demand for the most current information

## Usage Examples

### Monitoring API Consumption
```bash
# Get current usage statistics
curl -X POST http://localhost:3000/api/v1/keys/usageAnalytics \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### Tracking Specific Key Usage
```bash
# Get analytics for a specific API key
curl -X POST http://localhost:3000/api/v1/keys/usageAnalytics \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password", "apiKeyId": "specific-uuid"}'
```

### Viewing All Keys with Usage Data
```bash
# Get all API keys with their usage counts
curl -X POST http://localhost:3000/api/v1/keys/getApiKeys \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

## Benefits

### 1. **Transparency**
- Users can see exactly how much their API keys are being used
- Clear visibility into API consumption patterns

### 2. **Cost Management**
- Track usage to optimize API key usage
- Identify unused or overused keys

### 3. **Security**
- Monitor for unusual usage patterns
- Track when keys were last used for security audits

### 4. **Performance Optimization**
- Identify most-used keys for potential optimization
- Understand usage patterns for capacity planning

## Testing

Use the provided test script to verify the functionality:

```bash
./test-api-usage-tracking.sh
```

The script will:
1. Test API key generation
2. Verify usage count display
3. Test usage analytics endpoints
4. Provide manual testing instructions

## Migration Notes

### Database Changes
- New `usageCount` field added to `ApiKey` table
- Existing API keys will have `usageCount = 0` by default
- `lastUsedAt` field already existed and was being updated

### Backward Compatibility
- All existing API endpoints continue to work unchanged
- New fields are optional in responses (though always present)
- No breaking changes to existing functionality

## Future Enhancements

Potential future improvements could include:

1. **Usage Rate Limiting**: Implement rate limiting based on usage patterns
2. **Usage Alerts**: Notify users when usage exceeds thresholds
3. **Usage History**: Track usage over time periods (daily, weekly, monthly)
4. **Usage Export**: Allow users to export usage data for analysis
5. **Usage Dashboards**: Web-based visualization of usage patterns

## Security Considerations

- Usage data is only accessible to the API key owner
- All endpoints require proper authentication
- Usage tracking doesn't expose sensitive information
- Rate limiting is already in place for API key management endpoints

## Conclusion

The API key usage tracking system provides comprehensive monitoring and analytics capabilities while maintaining security and performance. Users now have full visibility into their API consumption patterns, enabling better resource management and cost optimization.
