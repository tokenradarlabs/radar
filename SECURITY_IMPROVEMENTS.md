# Security Improvements

This document outlines the security enhancements made to the Fastify application to address issue #69.

## Changes Made

### 1. CORS Configuration
- **Plugin**: `@fastify/cors`
- **Configuration**:
  - Production: Restricts origins to allowed domains (configurable via `ALLOWED_ORIGINS` environment variable)
  - Development: Allows all origins for easier development
  - Supports credentials and common HTTP methods
  - Allows standard headers including `Authorization` and `X-API-Key`

### 2. Security Headers (Helmet)
- **Plugin**: `@fastify/helmet`
- **Features**:
  - Content Security Policy (CSP) configured with restrictive directives
  - Automatic security headers for various vulnerabilities
  - Protection against clickjacking, XSS, and other common attacks

### 3. Request Size Limits
- **Configuration**: `bodyLimit: 1048576` (1MB)
- **Purpose**: Prevents large payload attacks and DoS attempts

## Environment Variables

### Required for Production
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS
  - Example: `https://tokenradar.com,https://api.tokenradar.com`
  - Default: `https://tokenradar.com`

## Security Benefits

1. **Cross-Origin Protection**: Prevents unauthorized cross-origin requests
2. **Header Security**: Adds multiple security headers to protect against common web vulnerabilities
3. **Request Size Protection**: Prevents large payload attacks
4. **Content Security Policy**: Mitigates XSS attacks by controlling resource loading

## Testing

The security configurations have been tested and verified to:
- Build successfully with TypeScript
- Start the development server without errors
- Maintain existing functionality while adding security layers

## Future Considerations

- Monitor CORS logs in production to ensure legitimate requests aren't blocked
- Adjust CSP directives based on actual application needs
- Consider implementing additional security measures like:
  - Input validation and sanitization
  - API authentication improvements
  - Request logging for security monitoring
